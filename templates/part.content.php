<div id="app-content-wrapper">
    <div class="container-fluid">
        <input
            name="todo-filter"
            id="todo-filter"
            type="text"
            ng-model="todoCtrl.tdFilter"
            placeholder="Filter"
        />
        <div ng-view></div>
    </div>
</div>