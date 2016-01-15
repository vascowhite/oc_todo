<?php style('todo', 'style'); ?>
<div id="app">
    <div id="app-navigation">
        <?php print_unescaped($this->inc('part.navigation')); ?>
        <?php print_unescaped($this->inc('part.settings')); ?>
    </div>
    <div id="app-content">
        <?php print_unescaped($this->inc('part.content')); ?>
    </div>
</div>
<?php script('todo', ['todo',]);