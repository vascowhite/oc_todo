<div id="app" ng-app="todo">
    <div id="app-navigation">
        <todo-navigation></todo-navigation>
        <div id="app-settings">
            <div id="app-settings-header">
                <button class="settings-button"
                        data-apps-slide-toggle="#app-settings-content"
                ></button>
            </div>
            <todo-settings></todo-settings>
        </div>
    </div>
    <div id="app-content">
        <todo-content></todo-content>
    </div>
</div>