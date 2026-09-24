// ════════════════════════════════════════════════════════════════
//  CNCdok — JAZYK / LANGUAGE (SK / EN)
//  Appka je napísaná po slovensky. Ak je zvolená angličtina, tento
//  skript za behu preloží všetok zobrazený text (aj hlášky, okná,
//  potvrdenia). Nový text v appke = doplniť ho do slovníka EN nižšie.
//  Musí sa načítať v <head> ako prvý skript (pred obsahom stránky).
// ════════════════════════════════════════════════════════════════
(function () {
    var LANG_KEY = 'cnc_lang';
    var lang = null;
    try { lang = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (lang !== 'sk' && lang !== 'en') {
        var nl = (navigator.language || 'sk').toLowerCase();
        lang = (nl.indexOf('sk') === 0 || nl.indexOf('cs') === 0) ? 'sk' : 'en';
    }
    window.CNC_LANG = lang;
    document.documentElement.lang = lang;

    window.setLanguage = function (l) {
        try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
        location.reload();
    };

    if (lang === 'sk') { window.tr = function (s) { return s; }; return; }

    var EN = {
        "Digitálna dielňa": "Digital workshop",
        "Prihláste sa pre prístup k výkresom": "Sign in to access your drawings",
        "Prihlásiť cez Google": "Sign in with Google",
        "alebo": "or",
        "Prihlásiť": "Sign in",
        "Prihlásiť sa": "Sign in",
        "Registrovať": "Register",
        "Email adresa": "Email address",
        "Heslo": "Password",
        "Heslo (min. 6 znakov)": "Password (min. 6 characters)",
        "Zopakujte heslo": "Repeat password",
        "Zabudli ste heslo?": "Forgot your password?",
        "Vaše dáta sú uložené bezpečne na vašom účte.": "Your data is stored securely in your account.",
        "Načítavam...": "Loading...",
        "Odhlásiť": "Sign out",
        "Odhlásiť sa": "Sign out",
        "Odhlásiť sa?": "Sign out?",
        "Nastavenia": "Settings",
        "Používateľ": "User",
        "Pripojený · dáta synchronizované": "Online · data synced",
        "Offline · dáta uložené lokálne": "Offline · data saved locally",
        "Synchronizujem...": "Syncing...",
        "Nesynchronizované": "Not synced",
        "Nainštalovať CNCdok": "Install CNCdok",
        "Pridať na plochu · funguje offline": "Add to home screen · works offline",
        "Inštalovať": "Install",
        "Aplikácia nainštalovaná ✓": "App installed ✓",
        "Späť na hlavnú": "Back to home",
        "Zavrieť": "Close",
        "Zrušiť": "Cancel",
        "Uložiť": "Save",
        "Potvrdiť": "Confirm",
        "Pokračovať": "Continue",
        "Hotovo": "Done",
        "Vybrať": "Select",
        "Vyberte": "Select",
        "Voliteľné": "Optional",
        "Upraviť": "Edit",
        "Vymazať": "Delete",
        "Odobrať": "Remove",
        "Predĺžiť": "Extend",
        "Pridať": "Add",
        "skúste znova": "try again",
        "obrázok": "image",
        "zmeniť ▾": "change ▾",
        "zobraziť detail →": "view detail →",
        "Nič nenájdené": "Nothing found",
        "Stroje — základ všetkého": "Machines — the foundation",
        "Stroje": "Machines",
        "Stroj": "Machine",
        "Stroj:": "Machine:",
        "Nájsť výkres": "Find drawing",
        "Pridať výkres": "Add drawing",
        "Nájsť nástroj": "Find tool",
        "Pridať nástroj": "Add tool",
        "Upraviť / vymazať výkres": "Edit / delete drawing",
        "Upraviť / vymazať nástroj": "Edit / delete tool",
        "Hľadaj výkres": "Find drawing",
        "Hľadaj nástroj": "Find tool",
        "Pridaj výkres": "Add drawing",
        "Pridaj nástroj": "Add tool",
        "Nový výkres do databázy": "New drawing to the database",
        "Nový nástroj do databázy": "New tool to the database",
        "Vyhľadaj, uprav alebo odstráň": "Find, edit or remove",
        "Vyhľadaj a odstráň": "Find and remove",
        "Vymaž výkres": "Delete drawing",
        "Vymaž nástroj": "Delete tool",
        "Vymazať výkres": "Delete drawing",
        "Vymazať nástroj": "Delete tool",
        "Napr. Fréza 1, Sústruh 2...": "E.g. Mill 1, Lathe 2...",
        "Pridajte prvý stroj": "Add your first machine",
        "Najprv pridajte stroj": "Add a machine first",
        "Najprv pridajte stroj!": "Add a machine first!",
        "Vyberte stroj": "Select a machine",
        "Vyberte stroj!": "Select a machine!",
        "— Vyberte stroj —": "— Select a machine —",
        "— Vyberte stroj na vymazanie —": "— Select a machine to delete —",
        "— Všetky stroje —": "— All machines —",
        "— Bez konkrétneho stroja —": "— No specific machine —",
        "Bez konkrétneho stroja": "No specific machine",
        "Všetky stroje": "All machines",
        "Zadajte názov stroja!": "Enter a machine name!",
        "Stroj už existuje!": "Machine already exists!",
        "Stroj pridaný ✓": "Machine added ✓",
        "Vymazanie stroja": "Delete machine",
        "Vymazanie stroja — nebezpečná zóna": "Delete machine — danger zone",
        "Vymazať vybraný stroj": "Delete selected machine",
        "Vymaže sa stroj aj všetky jeho výkresy a nástroje.": "The machine and all its drawings and tools will be deleted.",
        "Pozor: vymaže sa aj všetky výkresy a nástroje daného stroja!": "Warning: all drawings and tools of this machine will be deleted too!",
        "Akcia sa nedá vrátiť!": "This cannot be undone!",
        "Stroj (voliteľné, len ako poznámka)": "Machine (optional, just a note)",
        "Univerzálny nástroj": "Universal tool",
        "Univerzálny nástroj (bez konkrétneho stroja)": "Universal tool (no specific machine)",
        "Bez stroja": "No machine",
        "1 · Fotky / skeny výkresu": "1 · Drawing photos / scans",
        "2 · Stroj": "2 · Machine",
        "3 · Číslo výkresu": "3 · Drawing number",
        "4 · Číslo programu": "4 · Program number",
        "5 · Poznámka / revízia": "5 · Note / revision",
        "Číslo výkresu": "Drawing number",
        "Číslo výkresu...": "Drawing number...",
        "Číslo programu": "Program number",
        "Poznámka / revízia": "Note / revision",
        "Poznámka": "Note",
        "Fotka výkresu": "Drawing photo",
        "Odfotiť": "Take photo",
        "Zo zariadenia": "From device",
        "Nová fotka": "New photo",
        "Dôležité info, revízie...": "Important info, revisions...",
        "Technologické poznámky, revízie...": "Process notes, revisions...",
        "Nástroje k výkresu (voliteľné)": "Tools for this drawing (optional)",
        "Nástroje k výkresu": "Tools for this drawing",
        "Pridať nástroje": "Add tools",
        "Upraviť nástroje": "Edit tools",
        "Uložiť výkres": "Save drawing",
        "Uložiť zmeny": "Save changes",
        "Uložiť nástroje": "Save tools",
        "Upraviť výkres": "Edit drawing",
        "Detail výkresu": "Drawing detail",
        "Zadajte číslo výkresu": "Enter a drawing number",
        "Zadajte číslo výkresu...": "Enter a drawing number...",
        "Zadajte číslo výkresu!": "Enter a drawing number!",
        "Vyberte stroj alebo zadajte číslo": "Select a machine or enter a number",
        "Zatiaľ žiadne výkresy": "No drawings yet",
        "Výkres nenájdený": "Drawing not found",
        "Výkres s týmto číslom už existuje!": "A drawing with this number already exists!",
        "Toto číslo už používa iný výkres": "This number is already used by another drawing",
        "Použite iné číslo alebo upravte existujúci výkres.": "Use a different number or edit the existing drawing.",
        "Výkres uložený ✓": "Drawing saved ✓",
        "Výkres vymazaný": "Drawing deleted",
        "Výkres predĺžený ✓": "Drawing extended ✓",
        "Číslo výkresu nemôže byť prázdne!": "Drawing number cannot be empty!",
        "Kliknutím priblížite": "Tap to zoom",
        "Pinch = zoom · 2× tap = priblíž": "Pinch = zoom · double tap = zoom in",
        "Reset": "Reset",
        "Bez fotky": "No photo",
        "Pridať ďalšiu fotku": "Add another photo",
        "Pridať fotku": "Add photo",
        "Fotka vymazaná ✓": "Photo deleted ✓",
        "Fotky pridané ✓": "Photos added ✓",
        "Pridávam fotky...": "Adding photos...",
        "Vymazať túto fotku z výkresu?": "Delete this photo from the drawing?",
        "Ukladám...": "Saving...",
        "Uložené ✓": "Saved ✓",
        "Zmeny uložené ✓": "Changes saved ✓",
        "Uložené lokálne, synchronizuje sa...": "Saved locally, syncing...",
        "Uložené lokálne, nahrá sa pri wifi": "Saved locally, will upload on Wi-Fi",
        "Uloží sa pri wifi": "Will save on Wi-Fi",
        "Zmena sa uloží pri wifi": "Change will save on Wi-Fi",
        "Výkresy prevedené do nového formátu ✓": "Drawings converted to the new format ✓",
        "Kategória": "Category",
        "Kategória nástroja": "Tool category",
        "Vyberte kategóriu nástroja!": "Select a tool category!",
        "Vyberte kategóriu!": "Select a category!",
        "Typ / vyhotovenie": "Type / version",
        "— Vyberte typ —": "— Select type —",
        "Vyberte typ nástroja!": "Select a tool type!",
        "Priemer / polomer / dĺžka": "Diameter / radius / length",
        "Priemer / dĺžka": "Diameter / length",
        "Priemer / rozmer": "Diameter / size",
        "Popis · priemer · dĺžka": "Description · diameter · length",
        "Označenie / VBD / rozmer": "Designation / insert / size",
        "Označenie závitu (napr. M8, M10x1.25)": "Thread size (e.g. M8, M10x1.25)",
        "Napr. D10, R0.8, dĺžka 80": "E.g. D10, R0.8, length 80",
        "Napr. D10, R0.8": "E.g. D10, R0.8",
        "Napr. O1001": "E.g. O1001",
        "Napr. V-2026-001": "E.g. D-2026-001",
        "Poznámka / korekcia": "Note / offset",
        "Dĺžková korekcia, otáčky, posuv...": "Length offset, speed, feed...",
        "Fotka nástroja": "Tool photo",
        "Fotka nástroja (voliteľné)": "Tool photo (optional)",
        "Uložiť nástroj": "Save tool",
        "Upraviť nástroj": "Edit tool",
        "Detail nástroja": "Tool detail",
        "Nástroj": "Tool",
        "Priemer alebo názov (D10, vrták...)": "Diameter or name (D10, drill...)",
        "Priemer alebo názov...": "Diameter or name...",
        "Zadajte priemer alebo názov": "Enter a diameter or name",
        "Zadajte priemer/názov alebo vyberte kategóriu": "Enter a diameter/name or pick a category",
        "Vyberte stroj alebo zadajte priemer/názov": "Select a machine or enter a diameter/name",
        "Zatiaľ žiadne nástroje": "No tools yet",
        "Zatiaľ nemáte žiadne nástroje.": "You have no tools yet.",
        "Pridajte si prvý v sekcii \"Pridaj nástroj\".": "Add your first one in \"Add tool\".",
        "Zatiaľ nemáte žiadne nástroje — pridajte si ich v sekcii \"Pridaj nástroj\"": "You have no tools yet — add them in \"Add tool\"",
        "Nástroj nenájdený": "Tool not found",
        "Žiadne nástroje nenájdené": "No tools found",
        "Žiadne ďalšie nástroje nenájdené": "No more tools found",
        "Žiadne priradené nástroje": "No tools assigned",
        "Žiadny nástroj zatiaľ nevybraný": "No tool selected yet",
        "Nástroj uložený ✓": "Tool saved ✓",
        "Nástroj vymazaný": "Tool deleted",
        "Nástroj vytvorený a priradený ✓": "Tool created and assigned ✓",
        "Nástroje uložené ✓": "Tools saved ✓",
        "Nástroje prevedené do nového formátu ✓": "Tools converted to the new format ✓",
        "Vyplňte rozmer nástroja!": "Fill in the tool size!",
        "Vymazať fotku nástroja?": "Delete the tool photo?",
        "Vytvoriť nový nástroj": "Create a new tool",
        "Vytvoriť a priradiť": "Create and assign",
        "Ťuknutím pridáte alebo odoberiete nástroj. Označené sú priradené k výkresu.": "Tap to add or remove a tool. Highlighted tools are assigned to the drawing.",
        "Ťuknutím vyberiete nástroj. Zobrazené sú všetky nástroje z celej dielne — aj tie priradené k iným strojom.": "Tap to select a tool. All tools from the whole workshop are shown — including those assigned to other machines.",
        "Nástroje sú spoločné pre celú dielňu — použijete ich pri hocijakom výkrese. Stroj tu slúži len ako orientačná poznámka, napr. \"kúpené pre Fréza 1\".": "Tools are shared across the whole workshop — use them with any drawing. The machine here is just a reference note, e.g. \"bought for Mill 1\".",
        "Všetky": "All",
        "Všetky kategórie": "All categories",
        "Sústružnícke nože": "Turning tools",
        "Plátkové frézy": "Indexable milling cutters",
        "Tvrdokovové frézy": "Solid carbide end mills",
        "Plátkové vrtáky": "Indexable drills",
        "Tvrdokov vrtáky": "Solid carbide drills",
        "HSS vrtáky": "HSS drills",
        "Korunkové vrtáky": "Core drills",
        "Hrubovacie tyče": "Roughing boring bars",
        "Dokončovacie tyče": "Finishing boring bars",
        "Závitník": "Tap",
        "Uhlové nástroje (45°)": "Chamfer tools (45°)",
        "Iné": "Other",
        "Vonkajší hrubovací": "External roughing",
        "Vonkajší kopírovací": "External profiling",
        "Vonkajší zapichovací": "External grooving",
        "Vonkajší upichovací": "External parting-off",
        "Vnútorný hrubovací": "Internal roughing",
        "Vnútorný kopírovací": "Internal profiling",
        "Vnútorný zapichovací": "Internal grooving",
        "Závitový vonkajší": "External threading",
        "Závitový vnútorný": "Internal threading",
        "Metrický": "Metric",
        "Palcový": "Imperial (inch)",
        "Rúrkový (BSP)": "Pipe (BSP)",
        "Trapézový": "Trapezoidal",
        "Sprievodca / tutoriál": "Guide / tutorial",
        "Znova prejsť úvodným návodom": "Go through the intro guide again",
        "Zobrazenie sekcií": "Section layout",
        "Veľké dlaždice / kompaktný zoznam": "Large tiles / compact list",
        "Aktuálne: kompaktný zoznam": "Current: compact list",
        "Aktuálne: veľké dlaždice": "Current: large tiles",
        "Admin heslo": "Admin password",
        "Ochrana mazania záznamov": "Protects deleting records",
        "Spravovať predplatné": "Manage subscription",
        "Fakturácia cez Stripe": "Billing via Stripe",
        "Kde sa ukladajú vaše dáta?": "Where is your data stored?",
        "Zariadenie + cloud": "Device + cloud",
        "odporúčané": "recommended",
        "Dáta sú v mobile aj zálohované na serveri. Keď mobil stratíte alebo pokazíte, prihlásite sa na novom a všetko tam bude. Funguje aj bez internetu, zosynchronizuje sa po pripojení.": "Data is on your phone and backed up on the server. If you lose or break your phone, sign in on a new one and everything is there. Works offline too and syncs when you're back online.",
        "Len v tomto zariadení": "This device only",
        "Čísla výkresov, programy, poznámky a nástroje sa neodosielajú na server.": "Drawing numbers, programs, notes and tools are not sent to the server.",
        "Bez zálohy": "No backup",
        "— ak mobil stratíte, pokazíte alebo vymažete dáta prehliadača, nedajú sa obnoviť. Iné zariadenia ich neuvidia. Fotky sa aj tak ukladajú do zabezpečeného úložiska, preto pri ich pridávaní treba internet.": "— if you lose or break your phone or clear the browser data, it cannot be recovered. Other devices won't see it. Photos are still stored in secure cloud storage, so adding them needs internet.",
        "Ukladá sa len v tomto zariadení — bez zálohy. Zmeniť v ⚙️": "Saved on this device only — no backup. Change in ⚙️",
        "Ukladá sa len v tomto zariadení": "Saving on this device only",
        "Záloha do cloudu zapnutá": "Cloud backup enabled",
        "Ukladať LEN V TOMTO ZARIADENÍ?": "Save ON THIS DEVICE ONLY?",
        "• Nové a upravené výkresy a nástroje sa prestanú zálohovať na server.": "• New and edited drawings and tools will no longer be backed up to the server.",
        "• Ak mobil stratíte, pokazíte alebo vymažete dáta prehliadača, tieto zmeny sa NEDAJÚ obnoviť.": "• If you lose or break your phone or clear the browser data, these changes CANNOT be recovered.",
        "• Na iných zariadeniach ich neuvidíte.": "• You won't see them on other devices.",
        "• To, čo už je v cloude, tam zostane.": "• Whatever is already in the cloud stays there.",
        "Prepnúť?": "Switch?",
        "Zapnúť ZÁLOHU DO CLOUDU?": "Turn on CLOUD BACKUP?",
        "• Všetko, čo ste uložili len v tomto zariadení, sa teraz nahrá na server.": "• Everything you saved on this device only will now be uploaded to the server.",
        "• Dáta budú zálohované a uvidíte ich na všetkých zariadeniach, kde sa prihlásite.": "• Data will be backed up and visible on every device where you sign in.",
        "• Appka bude fungovať aj bez internetu, zosynchronizuje sa po pripojení.": "• The app will work offline too and sync when you're back online.",
        "Zapnúť?": "Turn on?",
        "Jazyk / Language": "Language / Jazyk",
        "Slovenčina / English": "Slovenčina / English",
        "Vitajte v CNCdok!": "Welcome to CNCdok!",
        "Začnime pridaním prvého stroja — napríklad \"Fréza 1\" alebo \"Sústruh CTX\". Neskôr môžete pridať ďalšie.": "Let's start by adding your first machine — for example \"Mill 1\" or \"Lathe CTX\". You can add more later.",
        "Pridať stroj": "Add machine",
        "Teraz pridajte prvý výkres — odfotíte ho mobilom, zadáte číslo a máte ho vždy po ruke.": "Now add your first drawing — take a photo with your phone, enter the number and it's always at hand.",
        "Pridať prvý výkres": "Add first drawing",
        "Chcete evidovať aj nástroje? Vrtáky, frézy, sústružnícke nože — všetko podľa stroja. Tento krok môžete preskočiť.": "Want to keep track of tools too? Drills, end mills, turning tools. You can skip this step.",
        "Preskočiť sprievodcu": "Skip the guide",
        "Preskočiť — som hotový": "Skip — I'm done",
        "Všetko pripravené!": "All set!",
        "Máte stroj, výkres aj nástroj. Aplikácia je pripravená na prácu pri stroji.": "You have a machine, a drawing and a tool. The app is ready for work at the machine.",
        "Rozumiem, začíname": "Got it, let's go",
        "Sprievodca spustený": "Guide started",
        "Sprievodcu môžete kedykoľvek vyvolať v nastaveniach": "You can open the guide anytime in settings",
        "Hotovo! Aplikácia je pripravená ✓": "Done! The app is ready ✓",
        "Staré výkresy": "Old drawings",
        "Tieto výkresy sú staršie ako 2 roky. Ak sa už nepoužívajú, môžete ich vymazať a uvoľniť miesto. Ak sa ešte hodia, predĺžte ich.": "These drawings are older than 2 years. If they're no longer used, you can delete them to free up space. If they're still useful, extend them.",
        "Pripomenúť o mesiac": "Remind me in a month",
        "Pripomenieme o mesiac": "We'll remind you in a month",
        "Admin heslo nebolo nastavené": "Admin password has not been set",
        "Najprv nastavte admin heslo": "Set the admin password first",
        "Vytvorte admin heslo": "Create admin password",
        "Toto heslo bude potrebné pri každom mazaní výkresov, nástrojov a strojov.": "This password will be required every time drawings, tools or machines are deleted.",
        "DÔLEŽITÉ: Chráňte si toto heslo. Kto ho pozná, môže natrvalo mazať dáta z dielne. Za jeho ochranu zodpovedáte vy.": "IMPORTANT: Keep this password safe. Anyone who knows it can permanently delete workshop data. You are responsible for protecting it.",
        "Vytvoriť heslo": "Create password",
        "Heslo nastavené ✓": "Password set ✓",
        "Potvrďte mazanie": "Confirm deletion",
        "Táto akcia natrvalo vymaže dáta. Zadajte admin heslo.": "This will permanently delete data. Enter the admin password.",
        "Nesprávne heslo — mazanie zrušené": "Wrong password — deletion cancelled",
        "Zmena hesla": "Change password",
        "Zmeniť heslo": "Change password",
        "Zadajte súčasné admin heslo.": "Enter the current admin password.",
        "Nové heslo": "New password",
        "Zadajte nové admin heslo.": "Enter the new admin password.",
        "Nesprávne súčasné heslo": "Wrong current password",
        "Potrebujete súčasné heslo": "You need the current password",
        "Správa hesla na mazanie dát.": "Manage the password for deleting data.",
        "Zabudol som heslo": "I forgot the password",
        "Obnova hesla": "Password recovery",
        "Obnova cez záložný kód": "Recover with backup code",
        "Zadajte záložný obnovovací kód, ktorý ste dostali pri vytvorení hesla.": "Enter the backup recovery code you received when you created the password.",
        "Overiť kód": "Verify code",
        "Neplatný obnovovací kód": "Invalid recovery code",
        "Kód overený. Nastavte nové admin heslo.": "Code verified. Set a new admin password.",
        "Pre tento účet nie je nastavený obnovovací kód": "No recovery code is set for this account",
        "Záložný obnovovací kód": "Backup recovery code",
        "Zapíšte si tento kód a uložte ho MIMO tabletu (peňaženka, trezor). Zobrazí sa iba teraz. Slúži na obnovenie hesla, ak ho zabudnete.": "Write this code down and keep it AWAY from the tablet (wallet, safe). It is shown only now. It lets you recover the password if you forget it.",
        "Kopírovať": "Copy",
        "Kód skopírovaný ✓": "Code copied ✓",
        "Kopírovanie zlyhalo — prepíšte ručne": "Copy failed — write it down manually",
        "Zapísal som si ho": "I've written it down",
        "Heslo musí mať aspoň 4 znaky!": "Password must be at least 4 characters!",
        "Heslo musí mať aspoň 6 znakov!": "Password must be at least 6 characters!",
        "Heslá sa nezhodujú!": "Passwords don't match!",
        "Nesprávne heslo": "Wrong password",
        "Zadajte heslo!": "Enter a password!",
        "Vyplňte email a heslo!": "Fill in email and password!",
        "Zadajte email adresu!": "Enter an email address!",
        "Email je už zaregistrovaný": "This email is already registered",
        "Účet neexistuje": "Account doesn't exist",
        "Neplatný email": "Invalid email",
        "Nesprávny email alebo heslo": "Wrong email or password",
        "Účet vytvorený ✓": "Account created ✓",
        "Email na obnovenie hesla odoslaný ✓": "Password reset email sent ✓",
        "Chyba prihlásenia": "Sign-in error",
        "Chyba": "Error",
        "Limit plánu": "Plan limit",
        "Limit plánu Firma": "Company plan limit",
        "Prejsť na Firmu": "Switch to Company",
        "Plán Firma": "Company plan",
        "Plán Jednotlivec": "Individual plan",
        "Skúšobná verzia": "Trial",
        "Všetko nahrané a zálohované": "Everything uploaded and backed up",
        "čaká na nahratie": "waiting to upload",
        "Nepodarilo sa": "Failed",
        "Nepodarilo sa uložiť": "Could not save",
        "Nepodarilo sa vymazať": "Could not delete",
        "Nepodarilo sa vytvoriť nástroj": "Could not create tool",
        "Uloženie zlyhalo": "Save failed",
        "Nahrávanie zlyhalo": "Upload failed",
        "Nahrávanie fotky zlyhalo": "Photo upload failed",
        "Nahrávanie fotiek zlyhalo": "Photo upload failed",
        "Fotka pripravená": "Photo ready",
        "Nová fotka pripravená": "New photo ready",
        "Čaká na nahratie": "Waiting to upload",
        "Používame nevyhnutné cookies pre prihlásenie a fungovanie aplikácie a voliteľne": "We use essential cookies for sign-in and for the app to work, and optionally",
        "na meranie návštevnosti.": "to measure traffic.",
        "Viac info": "More info",
        "Súhlasím so všetkým": "Accept all",
        "Len nevyhnutné": "Essential only",
        "Otvorte v Chrome alebo Safari": "Open in Chrome or Safari",
        "Tento prehliadač (Facebook, Instagram, Messenger...) nepodporuje Google prihlásenie.": "This browser (Facebook, Instagram, Messenger...) doesn't support Google sign-in.",
        "Kliknite na": "Tap",
        "(tri bodky) vpravo hore": "(three dots) at the top right",
        "Vyberte \"Otvoriť v Chrome\" alebo \"Otvoriť v Safari\"": "Choose \"Open in Chrome\" or \"Open in Safari\"",
        "\"Otvoriť v Chrome\"": "\"Open in Chrome\"",
        "\"Otvoriť v Safari\"": "\"Open in Safari\"",
        "Prihláste sa normálne": "Sign in as usual",
        "Môžete si tiež skopírovať odkaz a vložiť ho priamo do Chrome alebo Safari.": "You can also copy the link and paste it directly into Chrome or Safari.",
        "Premium účet": "Premium account",
        "Platnosť ›": "Validity ›",
        "Aktivovať": "Activate",
        "Aktivujte predplatné": "Activate a subscription",
        "Skúšobná doba sa skončila. Pre ďalší prístup k výkresom, strojom a nástrojom si vyberte plán.": "Your trial has ended. Choose a plan to keep accessing your drawings, machines and tools.",
        "Vybrať plán": "Choose a plan",
        "Po zaplatení sa prístup odomkne automaticky.": "Access unlocks automatically after payment.",
        "Načítavam predplatné…": "Loading subscription…",
        "Free — prístup uzamknutý": "Free — access locked",
        "Tarif": "Plan",
        "Predplatné": "Subscription",
        "Platné do": "Valid until",
        "Zostáva": "Remaining",
        "bez obmedzenia": "unlimited",
        "Jednotlivec": "Individual",
        "Partia / Firma": "Team / Company",
        "mesačné": "monthly",
        "ročné": "yearly",
        "Predplatné sa na konci obdobia automaticky obnoví, pokiaľ ho nezrušíte.": "The subscription renews automatically at the end of the period unless you cancel it.",
        "Prijať dáta z iného účtu": "Receive data from another account",
        "Zobrazí QR kód na naskenovanie": "Shows a QR code to scan",
        "Odoslať dáta do iného účtu": "Send data to another account",
        "Naskenujete QR kód na druhom zariadení": "Scan the QR code on the other device",
        "Prenos dát": "Data transfer",
        "Kód už neplatí. Na prijímajúcom zariadení vytvorte nový.": "The code is no longer valid. Create a new one on the receiving device.",
        "Tento kód už bol použitý. Na prijímajúcom zariadení vytvorte nový.": "This code has already been used. Create a new one on the receiving device.",
        "Taký kód neexistuje. Skontrolujte, či ste ho zadali správne.": "No such code. Check that you entered it correctly.",
        "Obe zariadenia sú prihlásené rovnakým účtom, dáta tu už máte.": "Both devices are signed in to the same account, the data is already here.",
        "Pre vybrané stroje nemáte žiadne výkresy ani nástroje.": "You have no drawings or tools for the selected machines.",
        "Vyberte aspoň jeden stroj.": "Select at least one machine.",
        "Nie ste prihlásený.": "You are not signed in.",
        "Prenos potrebuje internet. Pripojte sa na wifi alebo mobilné dáta.": "The transfer needs internet. Connect to Wi-Fi or mobile data.",
        "Nepodarilo sa načítať potrebné súčasti. Skontrolujte internet.": "Could not load required components. Check your internet.",
        "Funkcia prenosu ešte nie je nasadená na serveri.": "The transfer function is not deployed on the server yet.",
        "Chyba na serveri, skúste znova.": "Server error, please try again.",
        "Na tento prenos nemáte oprávnenie.": "You don't have permission for this transfer.",
        "Chyba prenosu, skúste znova.": "Transfer error, please try again.",
        "Kopírovanie ešte beží — nechajte okno otvorené": "Copying is still running — keep this window open",
        "Prenos sa nepodaril": "Transfer failed",
        "Skúsiť znova": "Try again",
        "Pripravujem kód...": "Preparing code...",
        "Prijať dáta": "Receive data",
        "Prijať dáta?": "Receive data?",
        "Na zariadení s dátami otvorte ⚙️ Nastavenia →": "On the device with the data, open ⚙️ Settings →",
        "a naskenujte tento kód.": "and scan this code.",
        "Kód vypršal. Vytvorte nový.": "The code has expired. Create a new one.",
        "Od": "From",
        "Komu": "To",
        "Výkresy": "Drawings",
        "Nástroje": "Tools",
        "všetky stroje": "all machines",
        "Dáta sa skopírujú do tohto účtu. Výkresy s číslom, ktoré tu už máte, sa preskočia a rovnaké nástroje sa nezdvoja.": "The data will be copied into this account. Drawings with a number you already have are skipped and identical tools are not duplicated.",
        "Prijať": "Accept",
        "Odmietnuť": "Decline",
        "Prijatie dát do tohto účtu potvrďte admin heslom.": "Confirm receiving data into this account with the admin password.",
        "Prenos odmietnutý": "Transfer declined",
        "Kopírujem dáta...": "Copying data...",
        "Nechajte appku otvorenú, kým sa prenos nedokončí.": "Keep the app open until the transfer finishes.",
        "Skopírované výkresy": "Drawings copied",
        "Preskočené (už existovali)": "Skipped (already existed)",
        "Nové nástroje": "New tools",
        "Prepojené na existujúce nástroje": "Linked to existing tools",
        "Fotky": "Photos",
        "Dáta sú skopírované na druhé zariadenie. Vo vašom účte zostalo všetko bez zmeny.": "The data has been copied to the other device. Everything in your account stays unchanged.",
        "Dáta prijaté ✓": "Data received ✓",
        "Máte zapnuté ukladanie len v tomto zariadení, server preto vaše dáta nevidí a nemôže ich poslať. V ⚙️ Nastaveniach zapnite „Zariadenie + cloud“, počkajte na synchronizáciu a skúste znova.": "You have \"this device only\" storage turned on, so the server can't see your data and can't send it. In ⚙️ Settings turn on \"Device + cloud\", wait for the sync and try again.",
        "Niektoré výkresy alebo nástroje ešte nie sú nahraté na server. Pripojte sa na wifi, počkajte, kým sa všetko nahrá, a skúste znova.": "Some drawings or tools are not uploaded to the server yet. Connect to Wi-Fi, wait until everything is uploaded and try again.",
        "V tomto účte zatiaľ nemáte žiadne výkresy ani nástroje na odoslanie.": "There are no drawings or tools in this account to send yet.",
        "Odoslať dáta": "Send data",
        "Na zariadení, ktoré má dáta prijať, otvorte ⚙️ Nastavenia →": "On the device that should receive the data, open ⚙️ Settings →",
        "a naskenujte jeho QR kód.": "and scan its QR code.",
        "Spúšťam kameru...": "Starting camera...",
        "alebo zadajte kód": "or enter the code",
        "napr. K7P 2QX": "e.g. K7P 2QX",
        "Namierte kameru na QR kód": "Point the camera at the QR code",
        "Kameru sa nepodarilo spustiť. Zadajte kód ručne.": "Could not start the camera. Enter the code manually.",
        "Kód má 6 znakov": "The code has 6 characters",
        "Overujem kód...": "Checking code...",
        "Čo chcete odoslať?": "What do you want to send?",
        "Všetko": "Everything",
        "alebo vyberte stroje": "or select machines",
        "Odošle sa kópia, vo vašom účte zostane všetko bez zmeny. K výkresom sa pribalia aj nástroje, ktoré majú priradené.": "A copy is sent and everything in your account stays unchanged. Tools assigned to the drawings are included too.",
        "Odoslať": "Send",
        "Odosielam...": "Sending...",
        "Odoslané": "Sent",
        "Teraz potvrďte prijatie na druhom zariadení.": "Now confirm receiving on the other device.",
        "Čaká sa na potvrdenie...": "Waiting for confirmation...",
        "Druhé zariadenie kopíruje dáta": "The other device is copying data",
        "Druhé zariadenie prenos odmietlo.": "The other device declined the transfer.",
        "Váš účet nemá aktívne predplatné. Prenos dát je dostupný počas skúšobnej doby alebo s Premium.": "Your account has no active subscription. Data transfer is available during the trial or with Premium.",
        "Prijímajúci účet nemá aktívne predplatné, preto nemôže prijať dáta.": "The receiving account has no active subscription, so it can't receive data.",
        "Odosielajúci účet už nemá aktívne predplatné, preto nemôže odoslať dáta.": "The sending account no longer has an active subscription, so it can't send data.",
        "Na druhom zariadení vyberte menej strojov a odošlite znova.": "On the other device, select fewer machines and send again.",
        "Prejdite na plán Firma, alebo na druhom zariadení vyberte menej strojov.": "Switch to the Company plan, or select fewer machines on the other device.",
        "Vyberte menej strojov a skúste znova.": "Select fewer machines and try again.",
        "Vyberte menej strojov, alebo nech prijímajúci účet prejde na plán Firma.": "Select fewer machines, or have the receiving account switch to the Company plan.",
        "Vybrať inak": "Choose differently",
        "Max 150 výkresov na stroj": "Max 150 drawings per machine",
        "Spracúvam fotku...": "Processing photo...",
        "Spracúvam fotky...": "Processing photos...",
        "Počkajte, fotky sa ešte spracúvajú": "Please wait, the photos are still being processed",
        "Fotku sa nepodarilo spracovať. Odfoťte ju priamo v appke alebo vyberte inú.": "The photo could not be processed. Take it directly in the app or choose another one."
    };

    // Slovenské plurály → anglické
    function pl(n, one, many) { return n + ' ' + (Number(n) === 1 ? one : many); }
    function unitEN(n, w) {
        if (/^(stroj|stroje|strojov)$/.test(w))       return pl(n, 'machine', 'machines');
        if (/^(výkres|výkresy|výkresov)$/.test(w))    return pl(n, 'drawing', 'drawings');
        if (/^(nástroj|nástroje|nástrojov)$/.test(w)) return pl(n, 'tool', 'tools');
        if (/^(fotka|fotku|fotky|fotiek)$/.test(w))   return pl(n, 'photo', 'photos');
        if (/^(deň|dni|dní)$/.test(w))                return pl(n, 'day', 'days');
        return null;
    }
    function uploadDetail(s) {
        return s.replace(/výkresy/g, 'drawings').replace(/nástroje/g, 'tools');
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    // Celé vety s premennou časťou (meno, číslo). Poradie je dôležité.
    var RULES = [
        [/^(\d+) (stroj|stroje|strojov|výkres|výkresy|výkresov|nástroj|nástroje|nástrojov|fotka|fotku|fotky|fotiek|deň|dni|dní)$/,
            function (m) { return unitEN(m[1], m[2]); }],
        [/^(\d+) čaká na nahratie$/, function (m) { return m[1] + ' waiting to upload'; }],
        [/^Krok (\d) z (\d)( · voliteľné)?$/, function (m) { return 'Step ' + m[1] + ' of ' + m[2] + (m[3] ? ' · optional' : ''); }],
        [/^⏳ Skúšobná verzia · ostáva (\d+) (deň|dni|dní)$/, function (m) { return '⏳ Trial · ' + unitEN(m[1], m[2]) + ' left'; }],
        [/^Stroj: (.+) · staré ([\d.,]+) roka$/, function (m) { return 'Machine: ' + m[1] + ' · ' + m[2] + ' years old'; }],
        [/^Stroj: ([^·\n]*)$/, function (m) { return 'Machine: ' + m[1]; }],
        [/^Poznámka: ([\s\S]*)$/, function (m) { return 'Note: ' + m[1]; }],
        [/^Pozn\.: ([\s\S]*)$/, function (m) { return 'Note: ' + m[1]; }],
        [/^Výkresy: ([^·\n]*)$/, function (m) { return 'Drawings: ' + m[1]; }],
        [/^Nástroje: ([^·\n]*)$/, function (m) { return 'Tools: ' + m[1]; }],
        [/^Stroj "([\s\S]+)" pridaný a vybraný ✓$/, function (m) { return 'Machine "' + m[1] + '" added and selected ✓'; }],
        [/^Stroj "([\s\S]+)" vymazaný$/, function (m) { return 'Machine "' + m[1] + '" deleted'; }],
        [/^Vymazať stroj "([\s\S]+)"\?$/, function (m) { return 'Delete machine "' + m[1] + '"?'; }],
        [/^Vymazať výkres "([\s\S]+)"\? Táto akcia sa nedá vrátiť\.$/, function (m) { return 'Delete drawing "' + m[1] + '"? This cannot be undone.'; }],
        [/^Vymazať výkres "([\s\S]+)"\?$/, function (m) { return 'Delete drawing "' + m[1] + '"?'; }],
        [/^Vymazať nástroj "([\s\S]+)"\?$/, function (m) { return 'Delete tool "' + m[1] + '"?'; }],
        [/^Výkres "([\s\S]+)" už existuje$/, function (m) { return 'Drawing "' + m[1] + '" already exists'; }],
        [/^Nahrávam (\d+) (fotku|fotky)\.\.\.$/, function (m) { return 'Uploading ' + unitEN(m[1], m[2]) + '...'; }],
        [/^✓ (\d+) (fotka pripravená|fotky pripravené)$/, function (m) { return '✓ ' + pl(m[1], 'photo', 'photos') + ' ready'; }],
        [/^Výkres uložený ✓ \((\d+) (fotka|fotiek)\)$/, function (m) { return 'Drawing saved ✓ (' + unitEN(m[1], m[2]) + ')'; }],
        [/^⬆️ Nahrávam (.+) — nechajte wifi zapnutú, kým sa nedokončí$/, function (m) { return '⬆️ Uploading ' + uploadDetail(m[1]) + ' — keep Wi-Fi on until it finishes'; }],
        [/^⏳ Čaká na nahratie: (.+) — pripojte wifi, dáta sú zatiaľ len v tablete$/, function (m) { return '⏳ Waiting to upload: ' + uploadDetail(m[1]) + ' — connect to Wi-Fi, data is only on this device for now'; }],
        [/^Nesynchronizované (\d+) dni\. Pripojte sa na wifi, nech sa dáta zálohujú\.$/, function (m) { return 'Not synced for ' + pl(m[1], 'day', 'days') + '. Connect to Wi-Fi so your data gets backed up.'; }],
        [/^POZOR: dáta neboli zálohované už (\d+) dní! Pripojte tablet na wifi, inak hrozí strata dát pri poruche\.$/, function (m) { return 'WARNING: data has not been backed up for ' + pl(m[1], 'day', 'days') + '! Connect the device to Wi-Fi or you risk losing data if it breaks.'; }],
        [/^(Plán Firma|Plán Jednotlivec|Skúšobná verzia) je obmedzený na (\d+) (strojov|výkresov|nástrojov)\.( Pre viac zvoľte plán Firma\.)?$/, function (m) {
            var who = { 'Plán Firma': 'The Company plan', 'Plán Jednotlivec': 'The Individual plan', 'Skúšobná verzia': 'The trial' }[m[1]];
            return who + ' is limited to ' + unitEN(m[2], m[3]) + '.' + (m[4] ? ' Choose the Company plan for more.' : '');
        }],
        [/^Nástroje (\d+\/\d+)$/, function (m) { return 'Tools ' + m[1]; }],
        [/^Výkresy (\d+\/\d+)$/, function (m) { return 'Drawings ' + m[1]; }],
        [/^Kód platí ešte (\d+:\d\d)$/, function (m) { return 'Code valid for ' + m[1]; }],
        [/^([\s\S]+?) Prenos dokončíte neskôr: ⚙️ → Prijať dáta z iného účtu\.$/, function (m) {
            var first = translate(m[1]);
            return (first !== null ? first : m[1]) + ' You can finish the transfer later: ⚙️ → Receive data from another account.';
        }],
        [/^Plán Firma je obmedzený na (\d+) výkresov na jeden stroj\.$/, function (m) { return 'The Company plan is limited to ' + m[1] + ' drawings per machine.'; }],
        [/^Plán Firma povoľuje najviac (\d+) výkresov na jeden stroj\. Stroj „([\s\S]+)“ má teraz (\d+), prenos by pridal (\d+)\.$/, function (m) {
            return 'The Company plan allows at most ' + m[1] + ' drawings per machine. Machine "' + m[2] + '" has ' + m[3] + ' now and the transfer would add ' + m[4] + '.';
        }],
        [/^(Tento účet|Prijímajúci účet) \((plán Firma|plán Jednotlivec|skúšobná verzia)\) môže mať najviac (\d+) (\S+)\. Teraz má (\d+), prenos by pridal (\d+)\.$/, function (m) {
            var subj = m[1] === 'Tento účet' ? 'This account' : 'The receiving account';
            var plan = { 'plán Firma': 'Company plan', 'plán Jednotlivec': 'Individual plan', 'skúšobná verzia': 'trial' }[m[2]];
            return subj + ' (' + plan + ') can have at most ' + (unitEN(m[3], m[4]) || (m[3] + ' ' + m[4])) + '. It has ' + m[5] + ' now and the transfer would add ' + m[6] + '.';
        }],
        [/^Vyplňte ([\s\S]+)!$/, function (m) {
            var t = EN[m[1]] || EN[cap(m[1])];
            return 'Fill in ' + (t ? t.toLowerCase() : m[1]) + '!';
        }]
    ];

    function translateCore(s) {
        if (Object.prototype.hasOwnProperty.call(EN, s)) return EN[s];
        for (var i = 0; i < RULES.length; i++) {
            var m = s.match(RULES[i][0]);
            if (m) return RULES[i][1](m);
        }
        return null;
    }

    // Preloží jeden riadok textu. Vráti null, ak nepozná (text zostane ako je).
    function translate(s, depth) {
        depth = depth || 0;
        if (!s || depth > 4) return null;
        var t = translateCore(s);
        if (t !== null) return t;

        // Ozdoby na začiatku/konci (emoji, ✓, ⚠, •, !, ?, ..., :) — preložiť jadro, ozdoby nechať
        var m = s.match(/^([^A-Za-zÀ-ž0-9"„]*)([\s\S]*?)([\s!?.…:✓]*)$/);
        if (m && (m[1] || m[3]) && m[2]) {
            var core = m[1] ? translateCore(m[2] + m[3]) : null;   // bez ozdoby na začiatku, s bodkou
            if (core !== null) return m[1] + core;
            core = translateCore(m[2]);                              // bez ozdôb na oboch stranách
            if (core !== null) return m[1] + core + m[3];
        }

        // "Text: zvyšok" — napr. "⚠ Uloženie zlyhalo: skúste znova"
        var c = s.match(/^([\s\S]+?): ([\s\S]+)$/);
        if (c) {
            var left = translate(c[1], depth + 1);
            if (left !== null) {
                var right = translate(c[2], depth + 1);
                return left + ': ' + (right !== null ? right : c[2]);
            }
        }

        // "Text (niečo v zátvorke)" — napr. "Plátkové frézy (Vcenter 102)"
        var p = s.match(/^([\s\S]+?) \(([^()]*)\)$/);
        if (p) {
            var head = translate(p[1], depth + 1);
            if (head !== null) return head + ' (' + p[2] + ')';
        }

        // Zložené z častí: "D20 · Tvrdokovové frézy", "Závitník – Metrický"
        var seps = [' · ', ' — ', ' – '];
        for (var k = 0; k < seps.length; k++) {
            if (s.indexOf(seps[k]) > 0) {
                var parts = s.split(seps[k]), changed = false;
                for (var j = 0; j < parts.length; j++) {
                    var tp = translate(parts[j], depth + 1);
                    if (tp !== null) { parts[j] = tp; changed = true; }
                }
                if (changed) return parts.join(seps[k]);
            }
        }
        return null;
    }

    // Preklad textu so zachovaním medzier okolo; viacriadkové po riadkoch
    function trText(raw) {
        if (!raw || !/[A-Za-zÀ-ž]/.test(raw)) return raw;
        if (raw.trim().indexOf('\n') !== -1) {
            // viacriadkové (okná confirm/alert) — každý riadok samostatne
            return raw.split('\n').map(trText).join('\n');
        }
        var lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
        var core = raw.trim().replace(/\s+/g, ' ');
        var out = translate(core);
        return out === null ? raw : lead + out + trail;
    }
    window.tr = trText;

    // ── DOM: prekladať text a atribúty všetkého, čo sa zobrazí ──
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
    var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

    function trTextNode(n) {
        var p = n.parentNode;
        if (!p || SKIP[p.nodeName]) return;
        if (p.closest && p.closest('[data-no-tr]')) return;
        var v = n.nodeValue, t = trText(v);
        if (t !== v) n.nodeValue = t;
    }
    function trAttrs(el) {
        for (var i = 0; i < ATTRS.length; i++) {
            var a = ATTRS[i];
            if (el.hasAttribute && el.hasAttribute(a)) {
                var v = el.getAttribute(a), t = trText(v);
                if (t !== v) el.setAttribute(a, t);
            }
        }
    }
    function walk(root) {
        if (root.nodeType === 3) { trTextNode(root); return; }
        if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
        if (root.nodeType === 1) { trAttrs(root); if (SKIP[root.nodeName]) return; }
        var tw = document.createTreeWalker(root, 5 /* ELEMENT | TEXT */, null);
        var n;
        while ((n = tw.nextNode())) {
            if (n.nodeType === 3) trTextNode(n);   // text v SCRIPT/STYLE/TEXTAREA preskočí trTextNode
            else trAttrs(n);                       // placeholder aj pri TEXTAREA
        }
    }

    var obs = new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            if (r.type === 'characterData') trTextNode(r.target);
            else if (r.type === 'attributes') trAttrs(r.target);
            else for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
        }
    });
    obs.observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    document.addEventListener('DOMContentLoaded', function () { walk(document); });

    // ── Dialógy (confirm / alert / prompt) ──
    var _confirm = window.confirm, _alert = window.alert, _prompt = window.prompt;
    window.confirm = function (msg) { return _confirm.call(window, trText(String(msg == null ? '' : msg))); };
    window.alert   = function (msg) { return _alert.call(window, trText(String(msg == null ? '' : msg))); };
    window.prompt  = function (msg, def) { return _prompt.call(window, trText(String(msg == null ? '' : msg)), def); };
})();
