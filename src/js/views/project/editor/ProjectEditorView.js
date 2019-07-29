define(['underscore',
        'jquery',
        'backbone',
        'models/project/ProjectModel',
        'views/EditorView',
        "views/project/editor/ProjEditorSectionsView",
        "text!templates/loading.html",
        "text!templates/project/editor/projectEditor.html"
      ],
function(_, $, Backbone, Project, EditorView, ProjEditorSectionsView, LoadingTemplate, Template){

  /**
  * @class ProjectEditorView
  */
  var ProjectEditorView = EditorView.extend({

    /**
    * The type of View this is
    * @type {string}
    */
    type: "ProjectEditor",

    /**
    * The short name OR pid for the project
    * @type {string}
    */
    projectIdentifier: "",

    /**
    * The ProjectModel that is being edited
    * @type {Project}
    */
    model: undefined,

    /**
    * The currently active editor section. e.g. Data, Metrics, Settings, etc.
    * @type {string}
    */
    activeSection: "",

    /**
    * References to templates for this view. HTML files are converted to Underscore.js templates
    */
    template: _.template(Template),
    loadingTemplate: _.template(LoadingTemplate),

    /**
    * The events this view will listen to and the associated function to call.
    * This view will inherit events from the parent class, EditorView.
    * @type {Object}
    */
    events: _.extend(EditorView.prototype.events, {
    }),

    /**
    * Creates a new ProjectEditorView
    * @constructs ProjectEditorView
    * @param {Object} options - A literal object with options to pass to the view
    */
    initialize: function(options){
      if(typeof options == "object"){
        // initializing the ProjectEditorView properties
        this.projectIdentifier = options.projectIdentifier ? options.projectIdentifier : undefined;
        this.activeSection = options.activeSection || "";
      }
    },

    /**
    * Renders the ProjectEditorView
    */
    render: function(){

      // Display a spinner to indicate loading until model is created.
      this.$el.html(this.loadingTemplate({
        msg: "Retrieving project details..."
      }));

      //Create the model
      this.createModel();

      // When the model has been synced, render the results
      this.stopListening();
      this.listenTo(this.model, "sync", this.authorizeUser);

      if ( this.model.get("id") ) {
        // If the project model already exists - fetch it.
        this.model.fetch();
      }
      else{
        // handling the default case where a new project model is created
        this.hideLoading();
      }

      return this;
    },

    /**
    * Renders the project editor view once the project view is created
    */
    renderProjectEditor: function() {

      //Add the template to the view and give the body the "Editor" class
      this.$el.html(this.template());
      $("body").addClass("Editor");

      var sectionsView = new ProjEditorSectionsView({
        model: this.model,
        projectIdentifier: this.projectIdentifier,
        activeSection: this.activeSection
      });
      sectionsView.render();
      this.$(".proj-editor-sections-container").html(sectionsView.el);

    },

    /**
    * Create a ProjectModel object
    */
    createModel: function(){


      /**
      * The name of the project
      * @type {string}
      */
      var projectName;

      /**
      * The dictionary object of project names mapped to corresponding identifiers
      * @type {object}
      */
      var projectsMap = MetacatUI.appModel.get("projectsMap");

      // Look up the project document seriesId by its registered name if given
      if ( this.projectIdentifier ) {
        if ( projectsMap ) {

          // Do a forward lookup by key
          if ( typeof (projectsMap[this.projectIdentifier] ) !== "undefined" ) {
            this.projectName = this.projectIdentifier;
            this.projectIdentifier = projectsMap[this.projectIdentifier];
          } else {
            // Try a reverse lookup of the project name by values
            this.projectName = _.invert(projectsMap)[this.projectIdentifier];

            if ( typeof this.projectName === "undefined" ) {
              //Try looking up the project name with case-insensitive matching
              this.projectName = _.findKey(projectsMap, function(value, key){
                return( key.toLowerCase() == this.projectIdentifier.toLowerCase() );
              });

              //If a matching project name was found, get the corresponding identifier
              if( this.projectName ){
                //Get the project ID from the map
                this.projectIdentifier = projectsMap[this.projectName];
              }
            }
          }
        }

        // Create a new project model with the identifier
        this.model = new Project({
          id: this.projectIdentifier
        });

      } else {
          // Create a new, default project model
          this.model = new Project();
      }
    },

    /**
     * The authorizeUser function checks if the current user is authorized
     * to edit the given ProjectModel. If not, a message is displayed and
     * the view doesn't render anything else.
     *
     * If the user isn't logged in at all, don't check for authorization and
     * display a message and login button.
     */
    authorizeUser: function() {

      //Remove the loading message
      this.hideLoading();

      //Only proceed if the user is logged in
      if ( MetacatUI.appUserModel.get("checked") && MetacatUI.appUserModel.get("loggedIn") ){

        if ( this.model.checkAuthority() ) {
          // Display the project editor
          this.renderProjectEditor();

          // Listens to the focus event on the window to detect when a user
          // switches back to this browser tab from somewhere else
          // When a user checks back, we want to check for log-in status
          MetacatUI.appView.listenForActivity();

          // Determine the length of time until the user's current token expires
          // Asks to sign in in case of time out
          MetacatUI.appView.listenForTimeout()
        }
        else {
          // generate error message
          var msg = "This is a private project. You're not authorized to access this project.";

          //Show the not authorized error message
          MetacatUI.appView.showAlert(msg, "alert-error", ".proj-editor-sections-container")
        }
      }
      else if ( !MetacatUI.appUserModel.get("loggedIn") ){

        // generate error message
        var msg = 'This is a private project. If you believe you have permission ' +
                  'to access this project, then <a href="' + MetacatUI.root +
                  '/signin">sign in</a>.';

        //Show the not logged in error
        MetacatUI.appView.showAlert(msg, "alert-error", ".proj-editor-sections-container")
      }
    },

    /**
     * Hides the loading
     */
    hideLoading: function() {

      // Find the loading object and remove it.
      if (this.$el.find(".loading")) {
        this.$el.find(".loading").remove();
      }
    }

  });

  return ProjectEditorView;

});
