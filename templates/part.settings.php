<div id="app-settings-content">
    <label for="todoPath">Path to todo.txt</label>
    <input type="text"
           ng-model="options.todoPath"
           ng-blur="settingsCtrl.setOption('todoPath', options.todoPath)"
           name="todoPath"
           id="todoPath"
    />

    <label for="donePath">Path to done.txt</label>
    <input type="text"
           ng-model="options.donePath"
           ng-blur="settingsCtrl.setOption('donePath', options.donePath)"
           name="donePath"
           id="donePath">
</div>