/** Riot Control **/

var RiotControl = {
    _stores: [],
    addStore: function (store) {
        this._stores.push(store);
    },
    reset: function () {
        this._stores = [];
    }
};

['on', 'one', 'off', 'trigger'].forEach(function (api) {
    RiotControl[api] = function () {
        var args = [].slice.call(arguments);
        this._stores.forEach(function (el) {
            el[api].apply(el, args);
        });
    };
});

if (typeof (module) !== 'undefined') module.exports = RiotControl;

/** App **/

$(function () {
    function Store () {
        riot.observable(this);
        var self = this;

        // Defaults
        self.data = {};
        self.users = {};
        self.files = [];
        self.fields = [];
        self.tasks = [];
        self.permissions = [];
        self.comments = [];


        // Query
        $.ajax({
            url: "/sites/developer/Case/_api/SP.AppContextSite(@target)/web/lists/getbytitle('Cases')/items(5)/?" +
                "$expand=" +
                    "FieldValuesAsText," +
                    "RoleAssignments/Member,RoleAssignments/RoleDefinitionBindings," +
                    "ContentType/Fields," +
                    "Folder/Folders/Folders/ListItemAllFields/FieldValuesAsText," +
                    "Folder/Folders/Files/ListItemAllFields/FieldValuesAsText" +
                    "&@target='https%3A%2F%2Fpulseapp%2Esharepoint%2Ecom%2Fsites%2Fdeveloper'" +
                    "&CacheBust=" + Math.random(),
            headers: { "accept": "application/json;odata=verbose" }
        }).done(function (r) {
            self.files = r.d.Folder.Folders.results[0].Files.results;
            self.comments = r.d.Folder.Folders.results[1].Folders.results;
            self.tasks = r.d.Folder.Folders.results[2].Folders.results;
            self.data = r.d.FieldValuesAsText;
            self.fields = r.d.ContentType.Fields.results;
            self.permissions = r.d.RoleAssignments.results;
            self.trigger('files_changed', self.files);
            self.trigger('fields_changed', self.fields);
            self.trigger('data_changed', self.data);
            self.trigger('permissions_changed', self.permissions);
            self.trigger('tasks_changed', self.tasks);
            self.trigger('comments_changed', self.comments);
        });


        // Data
        self.on('fields_init', function () {
            self.trigger('fields_changed', self.fields);
        });

        self.on('data_init', function () {
            self.trigger('data_changed', self.data);
        })

        self.on('files_init', function () {
            self.trigger('files_changed', self.files);
        });

        self.on('tasks_init', function () {
            self.trigger('tasks_changed', self.tasks);
        });

        self.on('permissions_init', function () {
            self.trigger('permissions_changed', self.permissions);
        });

        self.on('comments_init', function () {
            self.trigger('comments_changed', self.permissions);
        });

        self.on('users_init', function () {
            self.trigger('users_changed', self.users);
        });


        // Operations
        self.on('users_find', function (opts) {
            if (!self.users[opts.userId]) {
                $.ajax({
                    url: "/sites/developer/Case/_api/SP.AppContextSite(@target)/web/getuserbyid(" + opts.userId + ")?@target='https%3A%2F%2Fpulseapp%2Esharepoint%2Ecom%2Fsites%2Fdeveloper'",
                    headers: { "accept": "application/json;odata=verbose" }
                }).done(function (r) {
                    $.ajax({
                        url: "/sites/developer/Case/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v=%27" + encodeURIComponent(r.d.LoginName) + "%27&@target='https%3A%2F%2Fpulseapp%2Esharepoint%2Ecom%2Fsites%2Fdeveloper'",
                        headers: { "accept": "application/json;odata=verbose" }
                    }).done(function (r) {
                        self.users[opts.userId] = r.d;
                        self.trigger('users_changed', self.users);
                    });
                });
            } else {
                self.trigger('users_changed', self.users);
            }
        });

        self.on('comments_add', function (reply) {
            self.comments.push({
                ListItemAllFields: {
                    AuthorId: 9,
                    FieldValuesAsText: {
                        Title: reply
                    }
                }
            });
            self.trigger('users_changed', self.users);
        });
    }

    var store = new Store();
    RiotControl.addStore(store);
    riot.mount('app');
});