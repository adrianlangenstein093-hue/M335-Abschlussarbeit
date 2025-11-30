README – M335 Abschlussarbeit (PeakLog App)
Beschreibung

PeakLog ist eine einfache Fitness-App, die Trainingspläne und Workouts verwaltet und Sensordaten des Smartphones nutzt.
Die App wurde mit React Native / Expo entwickelt und speichert Daten in Firebase (Auth + Firestore).


Funktionen

Registrierung / Login (Firebase Auth)

Passwort ändern (Re-Auth + neues Passwort setzen)

Trainingspläne erstellen und speichern

Übungen erfassen und in Workouts verwenden

Freestyle-Workouts

Workout-Historie anzeigen

Zwei Sensorschnittstellen:

Schrittzähler (Pedometer)

Gyroskop

Toggle-Switch zum Aktivieren/Deaktivieren der Sensoren


Installation (lokal)
git clone https://github.com/adrianlangenstein093-hue/M335-Abschlussarbeit.git
cd M335-Abschlussarbeit
npm install
npx expo start


APK erstellen

Die App ist über EAS Build buildbar.
APK-Erzeugung:

Voraussetzungen:

npm install -g eas-cli
eas login


Build starten:

eas build -p android --profile release


Expo erstellt anschließend die APK in der Cloud und gibt einen Download-Link aus.


Benutzte Sensoren

Schrittzähler:
Wird auf der Startseite angezeigt. Zählt Schritte, solange Tracking aktiv ist.

Gyroskop:
Zeigt Rotationswerte (x/y/z) des Geräts an.
Wird ebenfalls über denselben Tracking-Switch gesteuert.


Firebase

Die App nutzt:

Firebase Authentication

Firestore (Speichern der Pläne, Übungen, Workouts)

Das Firebase-Setup liegt im Projekt unter src/context/AuthContext.tsx und firebaseConfig.ts.


Struktur

/app – Screens (Login/Home/Tabs/Settings/Workouts/History)

/src/context – AuthContext + Firebase-Anbindung

/components – kleinere UI-Komponenten

eas.json – Build-Konfiguration für APK

app.json – Expo-Konfiguration


Testplan ist im Wiki 
