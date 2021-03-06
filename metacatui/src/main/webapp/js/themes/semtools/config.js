var theme = theme || "semtools";
var themeTitle = "Metacat Data Catalog";
var themeMap = 
{
	'*': {
		// Template overrides are provided here
		
		// Resources (js) omit extension
		//'views/AboutView' : 'themes/' + theme + '/views/AboutView',
		//'routers/router' : 'themes/' + theme + '/routers/router',
		'models/AppModel' : 'themes/' + theme + '/models/AppModel',

		// Templates include extension
		'templates/app.html' : 'themes/' + theme + '/templates/app.html',
		'templates/search.html' : 'themes/' + theme + '/templates/search.html',
		'templates/resultsItem.html' : 'themes/' + theme + '/templates/resultsItem.html'
		}
};