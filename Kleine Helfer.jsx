/*
    Dieses Script erstellt ein ScriptUI-Panel für After Effects mit vier Hauptfunktionen, die in zwei Kategorien gruppiert sind:

    Kategorie "Verteilen":
    - Dynamisch: Verteilt ausgewählte Ebenen zwischen zwei Referenzobjekten mit Expressions (dynamische automatische Verteilung, die sich beim Verschieben der Referenzebenen anpasst).
    - Statisch: Verteilt ausgewählte Ebenen gleichmäßig zwischen zwei Ankerpunkten per Keyframes (statische Positionierung, keine Expressions).

    Kategorie "Organize":
    - Crypto: Importiert Cryptomatte-Dateien aus dem Quellordner der aktuell gewählten Footage und legt sie passend in der Projektstruktur ab.
    - Organize: Sortiert ausgewählte Footage-Dateien im Projektfenster nach ihrem Speicherort auf der Festplatte und verschiebt sie in passende After Effects Projektordner.

    Alle Funktionen sind über eigene Buttons im Panel aufrufbar. Die Oberfläche ist optisch in die zwei Kategorien gegliedert.
*/

function main(thisObj) {
    var win = thisObj instanceof Panel ? thisObj : new Window("palette", "ObjektVerteiler", undefined, {resizeable:true});
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    // --- Verteilen Kategorie ---
    var verteilenPanel = win.add('panel', undefined, 'Verteilen');
    verteilenPanel.orientation = 'row';
    verteilenPanel.alignChildren = ['fill', 'top'];

    var btnDynamic = verteilenPanel.add('button', undefined, 'Dynamisch');
	btnDynamic.helpTip = "Verteilt markierte Objekte dynamisch zwischen dem ersten und letzten Objekt.";
    var btnStatic  = verteilenPanel.add('button', undefined, 'Statisch');
	btnStatic.helpTip = "Verteilt markierte Objekte statisch zwischen dem ersten und letzten Objekt.";

    btnDynamic.onClick = function() {
        // Dynamische Verteilerfunktion (bisheriges Script aus dem Panel)
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return;
        var selectedLayers = comp.selectedLayers;
        var count = selectedLayers.length;
        if (count < 3) return;
        app.beginUndoGroup("Objekte dynamisch verteilen");
        var firstLayer = selectedLayers[0];
        var lastLayer  = selectedLayers[count - 1];
        for (var i = 1; i < count - 1; i++) {
            var currentLayer = selectedLayers[i];
            var expression =
                "var obj1 = thisComp.layer('" + firstLayer.name + "');\n" +
                "var obj2 = thisComp.layer('" + lastLayer.name + "');\n" +
                "var total = " + (count - 1) + ";\n" +
                "var idx = " + i + ";\n" +
                "var p1 = obj1.toWorld([0,0,0]);\n" +
                "var p2 = obj2.toWorld([0,0,0]);\n" +
                "var basis = p1 + (p2 - p1) / total * idx;\n" +
                "var offsetX = value[0] - basis[0];\n" +
                "var offsetY = value[1] - basis[1];\n" +
                "[basis[0] + offsetX, basis[1] + offsetY];";
            currentLayer.transform.position.expression = expression;
        }
        app.endUndoGroup();
    };
    btnStatic.onClick = function() {
        // Statische Verteilerfunktion (bisheriges Script aus dem Panel)
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return;
        var selectedLayers = comp.selectedLayers;
        var count = selectedLayers.length;
        if (count < 3) return;
        app.beginUndoGroup("Objekte statisch verteilen");
        var p1 = selectedLayers[0].property("Position").value;
        var p2 = selectedLayers[count - 1].property("Position").value;
        for (var i = 1; i < count - 1; i++) {
            var t = i / (count - 1);
            var newPos = [
                p1[0] + (p2[0] - p1[0]) * t,
                p1[1] + (p2[1] - p1[1]) * t
            ];
            selectedLayers[i].property("Position").setValue(newPos);
        }
        app.endUndoGroup();
    };

    // --- Organize Kategorie ---
    var organizePanel = win.add('panel', undefined, 'Organize');
    organizePanel.orientation = 'row';
    organizePanel.alignChildren = ['fill', 'top'];

    var btnCrypto   = organizePanel.add('button', undefined, 'Crypto');
	btnCrypto.helpTip = "Importiert Cryptomatte-Dateien aus Quellsequenz nach.";
    var btnOrganize = organizePanel.add('button', undefined, 'Organize');
	btnOrganize.helpTip = "Sortiert Footage in passende Projektordner.";

    btnCrypto.onClick = function() {
        // Cryptomatte Importfunktion (aus import_Cryptomatte.jsx übernehmen)
        var proj = app.project;
		var selectedItem = proj.activeItem;

		if (!selectedItem || !(selectedItem instanceof FootageItem)) {
			alert("Bitte eine Quell-Sequenz auswählen.");
		} else {
			var sourceFile = selectedItem.file;
			var parentFolder = sourceFile.parent;
			var fps = selectedItem.mainSource.conformFrameRate;

			var allFiles = parentFolder.getFiles();
			var cryptoFiles = [];
			for (var i = 0; i < allFiles.length; i++) {
				if (allFiles[i] instanceof File && allFiles[i].name.toLowerCase().indexOf("cryptomatte") !== -1) {
					cryptoFiles.push(allFiles[i]);
				}
			}

			if (cryptoFiles.length == 0) {
				alert("Keine Cryptomatte-Datei gefunden.");
			} else {
				var importOptions = new ImportOptions(cryptoFiles[0]);
				importOptions.sequence = true;
				app.beginUndoGroup("Cryptomatte Import");
				var importedItem = proj.importFile(importOptions);
				importedItem.mainSource.conformFrameRate = fps;
				var targetFolder = selectedItem.parentFolder || proj.rootFolder;
				importedItem.parentFolder = targetFolder;
				app.endUndoGroup();
			}
		}

    };
    btnOrganize.onClick = function() {
        // Footage-Organize Funktion (aus organize_footage-V3.jsx übernehmen)
        (function organizeSelectedFootage() {
		// Funktion zur Anzeige von Meldungen in einem benutzerdefinierten Fenster.
		function showMessage(message) {
			var myWindow = new Window("palette", "Skript-Meldung", undefined, {
				resizeable: false
			});
			myWindow.orientation = "column";
			myWindow.alignChildren = "center";
			
			var myText = myWindow.add("statictext", undefined, message, {
				multiline: true,
				justify: 'center'
			});
			myText.preferredSize = [300, 50];

			var myButton = myWindow.add("button", undefined, "OK");
			myButton.onClick = function() {
				myWindow.close();
			};

			myWindow.show();
		}
		
		// Funktion zum Abrufen oder Erstellen eines Zielordners.
		function getOrCreateFolder(parentFolder, folderName, existingFolders) {
			// Zuerst im Cache der bereits gefundenen/erstellten Ordner nachschlagen
			if (existingFolders[parentFolder.id] && existingFolders[parentFolder.id][folderName]) {
				return existingFolders[parentFolder.id][folderName];
			}

			// Suche im Projekt nach einem existierenden Ordner
			var newFolder = null;
			for (var i = 1; i <= parentFolder.numItems; i++) {
				var item = parentFolder.item(i);
				if (item instanceof FolderItem && item.name === folderName) {
					newFolder = item;
					break;
				}
			}

			// Falls kein Ordner gefunden wurde, einen neuen erstellen
			if (!newFolder) {
				newFolder = parentFolder.items.addFolder(folderName);
			}

			// Ordner zum Cache hinzufügen, um Duplikate und unnötige Suchen zu vermeiden
			if (!existingFolders[parentFolder.id]) {
				existingFolders[parentFolder.id] = {};
			}
			existingFolders[parentFolder.id][folderName] = newFolder;
			
			return newFolder;
		}

		// Startet eine Rückgängig-Gruppe, um die gesamte Aktion mit einem Klick rückgängig machen zu können.
		app.beginUndoGroup("Footage nach Ordnern organisieren");

		try {
			var selectedItems = app.project.selection;
			if (!selectedItems || selectedItems.length === 0) {
				showMessage("Bitte wählen Sie zuerst Footage-Dateien im Projektfenster aus.");
				return;
			}

			var footageFolders = {}; // Cache für die erstellten Ordner nach dem ID-Pfad des übergeordneten Ordners.
			var itemsToOrganize = [];

			// 1. Sammeln der zu organisierenden Dateien
			for (var i = 0; i < selectedItems.length; i++) {
				var currentItem = selectedItems[i];
				// Überprüft, ob es sich um eine Footage-Datei mit einem Quellpfad handelt.
				if (currentItem instanceof FootageItem && currentItem.file) {
					itemsToOrganize.push(currentItem);
				}
			}

			if (itemsToOrganize.length === 0) {
				showMessage("Es wurden keine Footage-Dateien ausgewählt, die organisiert werden können.");
				return;
			}

			// 2. Verarbeiten der gesammelten Dateien
			for (var j = 0; j < itemsToOrganize.length; j++) {
				var footageItem = itemsToOrganize[j];
				var sourceFile = footageItem.file;

				if (sourceFile) {
					// Den Namen des übergeordneten Ordners auf der Festplatte abrufen.
					var parentFolderName = sourceFile.parent.name;
					var destinationFolder = footageItem.parentFolder;

					// 3. Verschieben der Footage-Datei in den neuen Ordner.
					var newFolder = getOrCreateFolder(destinationFolder, parentFolderName, footageFolders);
					
					// Stellt sicher, dass das Element noch nicht im Zielordner ist.
					if (footageItem.parentFolder !== newFolder) {
						footageItem.parentFolder = newFolder;
					}
				}
			}

			showMessage(itemsToOrganize.length + " Footage-Dateien wurden erfolgreich in entsprechende Ordner verschoben.");

		} catch (e) {
			// Zeigt eine Fehlermeldung an, falls etwas schiefgelaufen ist.
			showMessage("Ein Fehler ist aufgetreten: " + e.toString());
		} finally {
			// Beendet die Rückgängig-Gruppe.
			app.endUndoGroup();
		}
	})();

    };

    win.layout.layout(true);
    return win;
}
main(this);

