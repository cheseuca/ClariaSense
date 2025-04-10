#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include "time.h"
#include <ArduinoJson.h>


FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// 🔹 NTP Configuration (Manila Time GMT+8)
const char* ntpServer = "asia.pool.ntp.org";
const long gmtOffset_sec = 8 * 3600; // GMT+8 Offset
const int daylightOffset_sec = 0; // No daylight saving in Manila

int lastLoggedHour = -1; // 🔹 Stores the last logged hour to prevent duplicates
bool signupOK = false;  // Declare globally

unsigned long sendDataPrevMillis = 0; // Declare to avoid scope issues
unsigned long fillWaitStartTime = 0;
bool inFillWaitPeriod = false;

#define RELAY_1 21
#define RELAY_2 19
#define RELAY_3 18
#define RELAY_4 5

float latestTemp = 0.0, latestTDS = 0.0, latestPH = 0.0;
float latestL1 = 0.0, latestL2 = 0.0, latestL3 = 0.0;
float latestDistance = 0.0;
float phVoltage = 0.0;

int mode = 1;
float drainLiters = 0.0;
float fillLiters = 0.0;
unsigned long fillStartTime = 0;
unsigned long fillDuration = 0;
unsigned long dumpStartTime = 0;
unsigned long drainStartTime = 0;
unsigned long pauseStartTime = 0;
unsigned long lastCheckTime = 0;

unsigned long lastLoggedTime = 0;  // Variable to track last log time for hourly logs
unsigned long lastParamLogTime = 0;  // Variable to track last log time for parameter out-of-range logs

void stopAllRelays() {
  digitalWrite(RELAY_1, HIGH);
  digitalWrite(RELAY_2, HIGH);
  digitalWrite(RELAY_3, HIGH);
  digitalWrite(RELAY_4, HIGH);
}

void checkMode() {
  unsigned long now = millis();

  switch (mode) {
    case 1: { // Continuous Mode
      if (latestTDS < 300 && latestPH < 8.9 && latestTemp < 33) {
        digitalWrite(RELAY_1, LOW);   // Continuous ON
        digitalWrite(RELAY_2, LOW);   // Continuous ON
        digitalWrite(RELAY_3, HIGH);  // Drain OFF
        digitalWrite(RELAY_4, HIGH);  // Fill OFF
        Serial.println("✅ Mode 1: Continuous Mode ACTIVE (Relay 1 & 2 ON)");
      } else {
        mode = 2; // Switch to Drain Mode
        drainLiters = 0.0;
        fillLiters = 0.0;
        fillWaitStartTime = 0;
        inFillWaitPeriod = false;
        drainStartTime = millis();  // 
        Serial.println("⚠️ Parameters out of range! Switching to Mode 2 (Drain/Fill Mode)");
      }
      break;
    }

    case 2: { // Drain Mode
      digitalWrite(RELAY_1, HIGH);
      digitalWrite(RELAY_2, LOW);
      digitalWrite(RELAY_3, HIGH);   // Drain ON
      digitalWrite(RELAY_4, HIGH);  // Fill OFF

      unsigned long drainElapsed = (millis() - drainStartTime) / 1000;
      Serial.print("🧯 Mode 2: Draining... ");
      Serial.print(drainElapsed);
      Serial.println(" sec / 12 sec");//5 liters

      if (drainElapsed >= 12) {
        pauseStartTime = millis();  // 
        mode = 3;
        Serial.println("✅ Drain complete (5L). Switching to Mode 3 (Pause)");
      }
      break;
    }

    case 3: { // Pause Mode
      digitalWrite(RELAY_1, HIGH);
      digitalWrite(RELAY_2, HIGH);
      digitalWrite(RELAY_3, HIGH);
      digitalWrite(RELAY_4, HIGH);

      unsigned long pauseElapsed = (millis() - pauseStartTime) / 1000;
      Serial.print("⏳ Mode 3: Pause... ");
      Serial.print(pauseElapsed);
      Serial.println(" sec / 60 sec");

      if (pauseElapsed >= 60) {
        fillStartTime = millis();
        mode = 4;
        Serial.println("🪣 Pause complete. Switching to Mode 4 (Fill ~3L)");
      }
      break;
    }

    case 4: { // Fill Mode
      digitalWrite(RELAY_1, HIGH);
      digitalWrite(RELAY_2, HIGH);
      digitalWrite(RELAY_3, HIGH);
      digitalWrite(RELAY_4, LOW);   // Fill ON

      unsigned long fillElapsed = (millis() - fillStartTime) / 1000;
      Serial.print("💧 Mode 4: Filling... ");
      Serial.print(fillElapsed);
      Serial.println(" sec / 24 sec");// 10 liters

      if (fillElapsed >= 24) {
        dumpStartTime = millis();
        mode = 5;
        Serial.println("✅ Fill complete (~10L). Switching to Mode 5 (Dump + Continuous)");
      }
      break;
    }

    case 5: { // Dump + Continuous
      digitalWrite(RELAY_1, HIGH);   // Continuous off
      digitalWrite(RELAY_2, HIGH);   // Continuous off
      digitalWrite(RELAY_3, LOW);   // Dump ON
      digitalWrite(RELAY_4, HIGH);  // Fill OFF

      unsigned long dumpElapsed = (millis() - dumpStartTime) / 1000;
      Serial.print("🚿 Mode 5: Dump... ");
      Serial.print(dumpElapsed);
      Serial.println(" sec / 30 sec");

      if (dumpElapsed >= 30) {
        mode = 1;
        lastCheckTime = millis();  
        Serial.println("✅ Dump done. Returning to Mode 1");
      }
      break;
    }
  }
}



// Function to log data once per hour (includes date)
void logHourlyData(float latestTemp, float latestTDS, float latestPH) {
    static String lastLoggedHour = "";
    static float tempBuf[10], tdsBuf[10], phBuf[10];
    static int sampleIndex = 0;
    static bool dataLoggedThisHour = false;
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Failed to obtain time");
        return;
    }

    char hourKey[20]; // e.g., 2025-04-04_13
    strftime(hourKey, sizeof(hourKey), "%Y-%m-%d_%H", &timeinfo);
    String currentHour = String(hourKey);
    int secondNow = timeinfo.tm_sec;
    
    // New hour, reset buffer & state
    if (currentHour != lastLoggedHour) {
        lastLoggedHour = currentHour;
        sampleIndex = 0;
        dataLoggedThisHour = false;
        
        // Check if document already exists for this hour
        char timestamp[25];
        strftime(timestamp, sizeof(timestamp), "%Y-%m-%d_%H:00:00", &timeinfo);
        String documentPath = "hourly_logs/" + String(timestamp);
        
        Serial.print("Checking if hourly data exists for: ");
        Serial.println(timestamp);
        
        if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str())) {
            FirebaseJson payload;
            payload.setJsonData(fbdo.payload().c_str());
            FirebaseJsonData jsonData;
            payload.get(jsonData, "name");
            
            if (jsonData.success) {
                Serial.println("Data already exists for this hour. Skipping collection.");
                dataLoggedThisHour = true; // Mark as already logged
            } else {
                Serial.println("No existing data found. Will collect samples.");
            }
        } else {
            Serial.println("Document check failed or document doesn't exist. Will collect samples.");
            // Error or document doesn't exist - continue with data collection
        }
    }
    
    // Collect samples in first 10 seconds if we haven't logged data yet
    if (!dataLoggedThisHour && secondNow < 10) {
        if (sampleIndex < 10) {
            tempBuf[sampleIndex] = latestTemp;
            tdsBuf[sampleIndex] = latestTDS;
            phBuf[sampleIndex] = latestPH;
            sampleIndex++;
            Serial.print("Collecting sample ");
            Serial.println(sampleIndex);
        }
        
        // Once 10 samples collected, log to Firestore
        if (sampleIndex == 10) {
            char timestamp[25];
            strftime(timestamp, sizeof(timestamp), "%Y-%m-%d_%H:00:00", &timeinfo);
            String documentPath = "hourly_logs/" + String(timestamp);
            FirebaseJson content;
            
            // Create proper Firestore array values for each sensor type
            FirebaseJsonArray tempArray, tdsArray, phArray;
            
            // Add values to arrays with proper Firestore format
            for (int i = 0; i < 10; i++) {
                FirebaseJson tempValue, tdsValue, phValue;
                
                tempValue.set("doubleValue", tempBuf[i]);
                tempArray.add(tempValue);
                
                tdsValue.set("doubleValue", tdsBuf[i]);
                tdsArray.add(tdsValue);
                
                phValue.set("doubleValue", phBuf[i]);
                phArray.add(phValue);
            }
            
            // Assign arrays to content
            content.set("fields/temp/arrayValue/values", tempArray);
            content.set("fields/tds/arrayValue/values", tdsArray);
            content.set("fields/ph/arrayValue/values", phArray);
            content.set("fields/timestamp/stringValue", String(timestamp));
            
            Serial.print("Logging 10-sample hourly data to Firestore... ");
            if (Firebase.Firestore.createDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), content.raw())) {
                Serial.println("Success!");
                dataLoggedThisHour = true;
            } else {
                Serial.println("Error: " + fbdo.errorReason());
            }
        }
    }
}


// Global variable to track the last time an error was logged
unsigned long lastErrorLogTime = 0;

void logParameterOutOfRange(float latestTemp, float latestTDS, float latestPH) {
    bool isOutOfRange = false;
    FirebaseJsonArray errorParamsArray;

    // Determine which parameters are out of range
    if (!latestTemp < 33) {
        FirebaseJson errorParam;
        errorParam.set("stringValue", "temperature");
        errorParamsArray.add(errorParam);
        isOutOfRange = true;
    }
    if (latestTDS > 299) {
        FirebaseJson errorParam;
        errorParam.set("stringValue", "TDS");
        errorParamsArray.add(errorParam);
        isOutOfRange = true;
    }
    if (latestPH > 8.9) {
        FirebaseJson errorParam;
        errorParam.set("stringValue", "pH");
        errorParamsArray.add(errorParam);
        isOutOfRange = true;
    }

    // Proceed only if something is out of range
    if (isOutOfRange) {
        unsigned long currentTime = millis();
        if ((currentTime - lastErrorLogTime >= 60000) || (currentTime < lastErrorLogTime)) {
            lastErrorLogTime = currentTime;

            String timestamp = getFormattedTime();
            String docID = timestamp;
            docID.replace(":", "-");
            docID.replace(" ", "_");
            docID.replace("/", "-");
            String documentPath = "error_logs/" + docID;

            FirebaseJson content;
            content.set("fields/temp/doubleValue", latestTemp);
            content.set("fields/tds/doubleValue", latestTDS);
            content.set("fields/ph/doubleValue", latestPH);
            content.set("fields/timestamp/stringValue", timestamp);
            content.set("fields/errorParameters/arrayValue/values", errorParamsArray);

            Serial.print("Logging out-of-range parameters to Firestore... ");
            if (Firebase.Firestore.createDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), content.raw())) {
                Serial.println("Success!");
            } else {
                Serial.println("Error: " + fbdo.errorReason());
            }
        }
    }
}



String getFormattedTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("⚠️ Failed to obtain time");
    return "Unknown";
  }

  char timeStr[30]; // Buffer for formatted time
  strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(timeStr);
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);

  // 🔹 Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected with IP: " + WiFi.localIP().toString());

  // 🔹 Firebase Setup
  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // 🔹 Anonymous Firebase Authentication
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Anonymous authentication successful.");
    signupOK = true; // ✅ Now it is declared and updated
  }else {
    Serial.printf("Firebase SignUp Error: %s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  
  Firebase.reconnectWiFi(true);

  // 🔹 Configure and Sync NTP Time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Waiting for NTP time sync...");
  delay(2000);

  pinMode(RELAY_1, OUTPUT);
  pinMode(RELAY_2, OUTPUT);
  pinMode(RELAY_3, OUTPUT);
  pinMode(RELAY_4, OUTPUT);
  stopAllRelays();
}

void loop() {
  // ✅ Step 1: Manual test via Serial (NOT Serial2)
  if (Serial.available()) {
    char input = Serial.read();
    if (input == '1') {
      mode = 1;
      Serial.println("▶️ Manual switch: Mode 1");
    } else if (input == '2') {
      mode = 2;
      drainLiters = 0.0;
      fillLiters = 0.0;
      inFillWaitPeriod = false;
      fillWaitStartTime = 0;
      Serial.println("▶️ Manual switch: Mode 2");
    } else if (input == '3') {
      mode = 3;
      dumpStartTime = millis();
      Serial.println("▶️ Manual switch: Mode 3");
    } 
  }

  // ✅ Step 2: Read JSON from Serial2 and update sensors
  while (Serial2.available()) {
    String data = Serial2.readStringUntil('\n');
    data.trim();
    
    if (data.startsWith("{")) {
      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, data);

      if (!error) {
        latestL1 = doc["l1"];
        latestL2 = doc["l2"];
        latestL3 = doc["l3"];
        latestTemp = doc["temp"];
        latestPH = doc["ph"];
        latestTDS = doc["tds"];
        latestDistance = doc["distance_in"];
        phVoltage = doc["ph_voltage"];
      } else {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
      }
    }
  }

  // ✅ Step 3: Run mode logic
  checkMode();

  // ✅ Step 4: Firebase updates
  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();
    Firebase.RTDB.setFloat(&fbdo, "sensors/temp", latestTemp);
    Firebase.RTDB.setFloat(&fbdo, "sensors/tds", latestTDS);
    Firebase.RTDB.setFloat(&fbdo, "sensors/ph", latestPH);
    Firebase.RTDB.setFloat(&fbdo, "sensorForRefill/distance", latestDistance);
    Firebase.RTDB.setFloat(&fbdo, "test/phVoltage", phVoltage);
    Firebase.RTDB.setFloat(&fbdo, "test/l1", latestL1);
    Firebase.RTDB.setFloat(&fbdo, "test/l2", latestL2);
    Firebase.RTDB.setFloat(&fbdo, "test/l3", latestL3);
  }

  // ✅ Step 5: Logging functions
  logHourlyData(latestTemp, latestTDS, latestPH);
  logParameterOutOfRange(latestTemp, latestTDS, latestPH);
}


  
