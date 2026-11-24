initAdmin();

// Init WYSIWYG
buildEmojiGrid();
document.execCommand('defaultParagraphSeparator', false, 'p');

// Ícono del artículo
buildArtIconGrid();

// Filtros de Seguimiento (Especie/Estatus)
buildFiltroDropdown('Especie');
buildFiltroDropdown('Estatus');
