<?php
spl_autoload_register(function($class){
    $parts = explode('\\', $class);
    if(!in_array('Tests', $parts) && array_shift($parts) === 'OCA' && array_shift($parts) == 'Todo'){
        $path = './' . implode('/', $parts) . '.php';
        include_once strtolower($path);
    }
});

spl_autoload_register(function($class){
    $parts = explode('\\', $class);
    if(in_array('Tests', $parts)){
        array_shift($parts);
        array_shift($parts);
        $parts[0] = strtolower($parts[0]);
        $path = implode('/', $parts) . '.php';
        include_once $path;
    }
});