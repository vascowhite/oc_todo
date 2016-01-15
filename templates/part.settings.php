<?php
if($_['hiliteOverdue'] ===  'true'){
    $hilite = 'checked';
} else {
    $hilite = '';
}

if($_['autoArchive'] === 'true'){
    $archive = 'checked';
} else {
    $archive = '';
}
?>
<div id="app-settings">
    <div id="app-settings-header">
        <button class="settings-button"
                data-apps-slide-toggle="#app-settings-content"
            ></button>
    </div>
    <div id="app-settings-content">
        <input type="checkbox" name="todoHiLiteOverdue" id="todoHiLiteOverdue" <?php  p($hilite); ?>>
        <label for="todoHiLiteOverdue">HiLite Overdue Items?</label><br>
        <input type="checkbox" name="todoAutoArchive" id="todoAutoArchive" <?php  p($archive); ?>>
        <label for="todoAutoArchive">Auto archive completed items?</label><br>
        <label for="todoPath">Path to todo.txt</label>
        <input type="text" value="<?php p($_['todoPath']); ?>" name="todoPath" id="todoPath">
        <label for="donePath">Path to done.txt</label>
        <input type="text" value="<?php p($_['donePath']); ?>" name="donePath" id="donePath">
    </div>
</div>