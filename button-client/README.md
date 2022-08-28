Install esp32 board manager, see instructions here:

https://randomnerdtutorials.com/installing-the-esp32-board-in-arduino-ide-windows-instructions/

Velg ESP32-WROVER


Hvis du får
Failed to connect to ESP32: Wrong boot mode detected (0x17)!

Når ESP32 peker oppover/strøm er nederst:
- venstre knapp: RST (EN, RTS)
- høyre knapp: FLASH/BOOT (IO0, DTR)

I det det står "Connecting...." i  konsollet:
- Trykk begge knappene samtidig.
- Slipp venstre knapp (RST) men hold fortsatt høyre (FLASH). Upload skal nå starte
- Slipp høyre knapp (FLASH).
  
https://docs.espressif.com/projects/esptool/en/latest/esp32/advanced-topics/boot-mode-selection.html#manual-bootloader

Manual reset: Hold down FLASH/BOT and press RST (EN).

PS: det er en bug i I2Cdev, beginTransaction ble kalt før requestFrom og førte til at alt låste seg med en gang. 
Jeg har kommentert ut dette og nå virker det.