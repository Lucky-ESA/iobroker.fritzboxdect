![Logo](../../admin/fritzboxdect.png)

# ioBroker.fritzboxdect

[Zurück zur README](/README.md)

# Zusammenfassung

-   [Instanz Einstellungen](#instanz-einstellungen)
    -   [Einstellungen TAB Fritzbox](#instanz-konfiguration-tab-fritzbox-erstellen)
    -   [Einstellungen TAB Symbole](#instanz-konfiguration-tab-symbole-erstellen)
-   [Geräte](#dect-geräte)
    -   [DECT 100](#dect-100)
    -   [DECT 200 - 210](#dect-200---210)
    -   [DECT 350](#dect-350)
    -   [DECT 400](#dect-400)
    -   [DECT 440](#dect-440)
    -   [DECT 500](#dect-500)
    -   [DECT 546E](#dect-546e)
    -   [DECT Comet](#dect-comet)
    -   [HAN-FUN](#han-fun)
    -   [Gruppen](#groups)
    -   [Vorlagen](#templates)
    -   [Trigger](#triggers)

# Instanz Einstellungen

### Instanz Konfiguration TAB Fritzbox erstellen

[Zusammenfassung](#zusammenfassung)

-   `Aktiv` Fritzbox aktivieren/deaktivieren
-   `Fritzbox-IP` IP der Fritzbox
-   `Nutzername` Login Benutzername
-   `Passwort` Passwort
-   `Protokoll` HTTP oder HTTPS
-   `Symbol auswählen` Das Icon wird unter Objekte angezeigt. Muss erst unter `Symbole erstellen` angelegt werden

![instance_1.png](img/instance_1.png)

-   `Booster` Heizungs Boost in Minuten
-   `Fenster öffnen` Fenster offen Modus in Minuten
-   `DECT Intervall` Intervall für die Aktualisierung der DECT und Gruppen. Je mehr Geräte vorhanden sind um so länger benötigit die Aktualisierung und dann macht 1 Sekunde kein Sinn. Benötigt der Adapter länger als der Intervall, wird die Aktaulisierung geskippt.
-   `Vorlagenintervall` Intervall für die Aktualisierung der Templates und Trigger. Kann mit 0 deaktiviert werden.

![instance_2.png](img/instance_2.png)

### Instanz Konfiguration TAB Symbole erstellen

-   `Symbolname` Name für das Bild. Kann dann unter `Fritzbox hinzufügen` ausgewählt werden
-   `Upload` Icon hochladen

![instance_3.png](img/instance_3.png)

![instance_4.png](img/instance_4.png)

[Zusammenfassung](#zusammenfassung)

# DECT Geräte

### DECT 100

[Zusammenfassung](#zusammenfassung)

### DECT 200 - 210

[Zusammenfassung](#zusammenfassung)

### DECT 350

[Zusammenfassung](#zusammenfassung)

### DECT 400

[Zusammenfassung](#zusammenfassung)

### DECT 440

[Zusammenfassung](#zusammenfassung)

### DECT 500

[Zusammenfassung](#zusammenfassung)

### DECT 546E

[Zusammenfassung](#zusammenfassung)

### DECT Comet

[Zusammenfassung](#zusammenfassung)

### HAN-FUN

[Zusammenfassung](#zusammenfassung)

# Groups

[Zusammenfassung](#zusammenfassung)

# Templates

[Zusammenfassung](#zusammenfassung)

# Triggers

```JSON
{
    "red"       : {"hue" : 358, "sat" : [180,112,54], "val" : [255,255,255] },
    "orange"    : {"hue" : 35,  "sat" : [214,140,72], "val" : [252,252,255] },
    "yellow"    : {"hue" : 52,  "sat" : [153,102,51], "val" : [255,255,255] },
    "lime"      : {"hue" : 92,  "sat" : [123, 79,38], "val" : [248,250,252] },
    "green"     : {"hue" : 120, "sat" : [160, 82,38], "val" : [220,232,242] },
    "turquoise" : {"hue" : 160, "sat" : [145, 84,41], "val" : [235,242,248] },
    "cyan"      : {"hue" : 195, "sat" : [179,118,59], "val" : [255,255,255] },
    "lightblue" : {"hue" : 212, "sat" : [169,110,56], "val" : [252,252,255] },
    "blue"      : {"hue" : 225, "sat" : [204,135,67], "val" : [255,255,255] },
    "purple"    : {"hue" : 266, "sat" : [169,110,54], "val" : [250,250,252] },
    "magenta"   : {"hue" : 296, "sat" : [140, 92,46], "val" : [250,252,255] },
    "pink"      : {"hue" : 335, "sat" : [180,107,51], "val" : [255,248,250] }
}
```

[Zusammenfassung](#zusammenfassung)
