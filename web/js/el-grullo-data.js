/**
 * Datos geográficos reales de El Grullo, Jalisco
 * H. Ayuntamiento de El Grullo, Jalisco
 *
 * Colonias (con su código postal) y nombres de calles reales del
 * municipio, usados para los selectores de domicilio del sitio
 * (antes solo tenían 4 colonias de ejemplo y ninguna calle real).
 *
 * Fuentes: directorios públicos de códigos postales y callejeros de
 * México (micodigopostal.org, telescopio.com.mx) para El Grullo, Jal.
 * No es necesariamente exhaustivo al 100%, pero cubre las colonias y
 * calles oficialmente documentadas del municipio.
 */

const COLONIAS_EL_GRULLO = [
  { nombre: '10 de Mayo',              cp: '48744' },
  { nombre: '7 de Abril',              cp: '48744' },
  { nombre: 'Ayuquila',                cp: '48745' },
  { nombre: 'Charco de los Adobes',    cp: '48742' },
  { nombre: 'Colomitos',               cp: '48744' },
  { nombre: 'Colomos',                 cp: '48744' },
  { nombre: 'Del Álamo',               cp: '48744' },
  { nombre: 'Del Sur',                 cp: '48743' },
  { nombre: 'El Aguacate',             cp: '48753' },
  { nombre: 'El Álamo',                cp: '48744' },
  { nombre: 'El Cacalote',             cp: '48745' },
  { nombre: 'El Cerrito',              cp: '48742' },
  { nombre: 'El Grullo Centro',        cp: '48740' },
  { nombre: 'El Pedregal',             cp: '48742' },
  { nombre: 'Ixtlán',                  cp: '48744' },
  { nombre: 'Jardines de Manantlán',   cp: '48743' },
  { nombre: 'Juan Canal',              cp: '48744' },
  { nombre: 'Juaquiniquil',            cp: '48744' },
  { nombre: 'La Laja',                 cp: '48745' },
  { nombre: 'La Puerta del Barro',     cp: '48747' },
  { nombre: 'La Quinta',               cp: '48743' },
  { nombre: 'Las Flores',              cp: '48743' },
  { nombre: 'Las Pilas',               cp: '48748' },
  { nombre: 'Laureles',                cp: '48744' },
  { nombre: 'Lomas del Valle',         cp: '48744' },
  { nombre: 'Mirador del Rosal',       cp: '48742' },
  { nombre: 'Oriente 1ra. Sección',    cp: '48743' },
  { nombre: 'Oriente 2da. Sección',    cp: '48743' },
  { nombre: 'Palma Sola',              cp: '48744' },
  { nombre: 'Palo Blanco',             cp: '48750' },
  { nombre: 'Patria',                  cp: '48744' },
  { nombre: 'Pocito Santo',            cp: '48742' },
  { nombre: 'Residencial',             cp: '48744' },
  { nombre: 'San Isidro',              cp: '48742' },
  { nombre: 'San Pedro',               cp: '48740' },
  { nombre: 'Santa Cecilia',           cp: '48744' },
  { nombre: 'Senderos del Manantial',  cp: '48742' },
  { nombre: 'Teposilama',              cp: '48743' },
];

const CALLES_EL_GRULLO = [
  '10 de Mayo','13 de Diciembre','15 de Septiembre','16 de Septiembre','18 de Marzo','1 de Mayo','20 de Noviembre','5 de Febrero','5 de Mayo',
  'Abel Robles','Acueducto','Adolfo López Mateos','Agapito Rentería','Álamo','Alberto Padilla','Aldama','Alejandra Díaz','Allende','Almendro','Álvaro Obregón','Álvaro Velasco','Amado Nervo','Amapola','Amole','Anáhuac','Andrés González','Arroyo','Aurelio Rubio','Ávila Camacho','Ayuntamiento','Azucena',
  'Bernardo Rosas','Brisa',
  'Carmen Serdán','Cedro','Celestina Pimienta','Cerro de la Bufa','Charco Azul','Circunvalación Oriente','Circunvalación Poniente','Clavel','Colomitos','Colomos','Colón','Conrado Díaz Infante','Constitución','Corregidora','Cosío Vidaurri','Cuarzo','Cuauhtémoc',
  'Daniel Arreola','Del Carmen','Del Mercado','Del Ozote','Del Sol','Del Sur','Desiderio Cobián','Diamante','División del Norte','Domingo A. Ramos','Donato Guerra','Dr. Andrés Gómez','Durazno',
  'Eduardo García','El Álamo','Emeterio Peregrina','Emiliano Zapata','Encino','Esmeralda','Estanislao García','Eucalipto','Eugenio Espinoza',
  'Felipe Ángeles','Félix González','Fernando Ramírez','Flores Magón','Francisco González Bocanegra','Francisco Rosas','Francisco Villa','Fresno',
  'Galeana','General Anaya','Girasol','Gladiola','Gómez Farías','Gorgonia Rivera','Granado','Guadalupe Victoria','Guamúchil','Guillermo Prieto','Guillermo Velasco','Gustavo Díaz Ordaz',
  'Herlinda Mancillas','Hidalgo','Hilario Álvarez',
  'Ignacio Zaragoza','Independencia','Isidro Colmenares','Israel López Corona',
  'Jaime Nuño','Jalapa','Jalisco','Janitzio','Javier Mina','José Ascensión Manzano','José Rubio','Juan Bustillos Orozco','Juan Carbajal','Juan Diego','Juan Torreros','Juan Valdivia','Juárez',
  'La Paz','La Quinta','Las Garzas','Las Grullas','Las Joyas','Laura Cosío','Lázaro Cárdenas','Leocadio Rodríguez','Leona Vicario','León Covarrubias','León Lepe','Leopoldo López','Lerdo de Tejada','Libertad','Libramiento Carretero','Lino Preciado Hernández','López Rayón','Los Adobes','Luis G. Urbina',
  'Manuel Acuña','Manuel Doblado','Manzano','Marcelino Hernández','Marea','Marian Morales','Mariano Abasolo','Mariano Jiménez','María Piña','Matamoros','México','Mezquite','Miguel Cobián','Miguel Zepeda Rosas','Moctezuma','Morelos','Municipio Libre',
  'Nance','Narciso Mendoza','Netzahualcóyotl','Nicolás Bravo','Nicolás Rivera','Niños Héroes',
  'Octavio Paz','Ónix','Oreste López','Orquídea','Otoño',
  'Pablo Leal','Palma','Pascual Flores','Pasteur','Patria','Pedro Michel Corona','Pedro Moreno','Pino','Pípila','Ponciano Florentino','Porfirio Nava','Primavera','Puebla',
  'Quintana Roo','Quirino Naranjo',
  'Ramón Acosta Ruiz','Ramón Michel Arias','Realito','Reforma','Río Ayuquila','Roble',
  'Salvador Covarrubias','San Pedro','Sergio Corona','Simona Castañeda','Solidaridad',
  'Tecopatlán','Tenochtitlán','Tepeyac','Terreros Azules','Texcoco','Tlatelolco',
  'Unidad','Urbano Rosales',
  'Valentín Velasco','Venustiano Carranza','Veracruz','Verano','Vicente Guerrero','Viejo a Ayuquila','Viento','Violeta',
  'Xicoténcatl','Xiloxúchitl','Xochimilco','Xóchitl',
  'Zafiro','Zarzamora','Zenzontla',
];
