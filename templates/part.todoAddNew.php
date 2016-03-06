<input
    name="todo-add-new"
    id="todo-add-new"
    type="text"
    placeholder="Enter a new Todo here"
    ng-model="todoAddNewCtrl.newTodo"
    ng-keypress="todoAddNewCtrl.addNew($event)"
/>