<?php
/*
    Copyright (C) 2015  Paul White

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * User: Paul White
 * Date: 14/10/2015
 *
 * File: todoservice.php
 * @package todo
 */

/**
 * @package
 */

namespace OCA\Todo\Service;


use OCA\Todo\Storage\TodoStorage;
use OCP\IConfig;
use Vascowhite\Todo\Todo;
use Vascowhite\Todo\TodoParser;

class TodoService
{
    /**
     * @var TodoStorage
     */
    private $storage;
    /**
     * @var IConfig
     */
    private $config;

    /**
     * @var string
     */
    private $AppName;
    private $UserId;

    /**
     * @param string      $AppName
     * @param TodoStorage $storage
     * @param IConfig     $config
     * @param             $UserId
     */
    public function __construct($AppName, TodoStorage $storage, IConfig $config, $UserId)
    {
        $this->storage = $storage;
        $this->config = $config;
        $this->AppName = $AppName;
        $this->UserId = $UserId;
    }

    /**
     * @return array[]
     */
    public function getList()
    {
        return [
            'todos' => $this->getTodos(),
        ];
    }

    /**
     * @return array[]
     */
    public function getTodos()
    {
        $todoArray = [];
        foreach($this->storage->readTodoList() as $todo){
            $todoArray[] = $this->todoToArray($todo);
        }
        return $todoArray;
    }

    /**
     * @param Todo $todo
     * @return array
     */
    public function todoToArray(Todo $todo)
    {
        $overdue = ($todo->getDue() && ($todo->getDue() < new \DateTime()) && !$todo->getCompleted());
        $created = null;
        if($todo->getCreated()){
            $created = $todo->getCreated()->format(Todo::TODO_DATE_FORMAT);
        }
        $due = null;
        if($todo->getDue()){
            $due = $todo->getDue()->format(Todo::TODO_DATE_FORMAT);
        }
        return [
            'priority'  => $todo->getPriority(),
            'text'      => $todo->getText(),
            'completed' => $todo->getCompleted(),
            'todo'      => $todo->__toString(),
            'overdue'   => $overdue,
            'projects'  => $todo->getProjects(),
            'contexts'  => $todo->getContexts(),
            'created'   => $created,
            'due'       => $due,
        ];
    }

    /**
     * @return string[]
     */
    public function getContexts()
    {
        $contexts = [];
        foreach($this->storage->readTodoList() as $todo){
            foreach($todo->getContexts() as $context){
                if(!in_array('@' . $context, $contexts)){
                    $contexts[] = '@' . $context;
                }
            }
        }
        return $contexts;
    }

    /**
     * @return string[]
     */
    public function getProjects()
    {
        $projects = [];
        foreach($this->storage->readTodoList() as $todo){
            foreach($todo->getProjects() as $project){
                if(!in_array('+' . $project, $projects)){
                    $projects[] = '+' . $project;
                }
            }
        }
        return $projects;
    }

    /**
     * @return array
     */
    public function getOptions()
    {
        $options = [];
        foreach($this->config->getUserKeys($this->UserId, $this->AppName) as $key){
            $options[$key] = $this->config->getUserValue($this->UserId, $this->AppName, $key);
        }
        return $options;
    }

    /**
     * @param Todo $todo
     * @return Todo
     */
    public function addTodo(Todo $todo)
    {
        $todoList = $this->storage->readTodoList();
        $todoList[] = $todo;
        $this->storage->writeTodoList($todoList);
        return $todo;
    }

    /**
     * @param Todo $TodoToDo
     * @return Todo
     */
    public function doTodo(Todo $TodoToDo)
    {
        $todoList = $this->storage->readTodoList();
        foreach($todoList as $key => $todo){
            if($todo->sameAs($TodoToDo)){
                $TodoToDo->done();
                $todoList[$key] = $TodoToDo;
                $this->storage->writeTodoList($todoList);
                return $TodoToDo;
            }
        }
    }

    /**
     * @param Todo $TodoToUndo
     * @return Todo
     */
    public function undoTodo(Todo $TodoToUndo)
    {
        $todoList = $this->storage->readTodoList();
        foreach($todoList as $key => $todo){
            if($todo->sameAs($TodoToUndo)){
                $TodoToUndo->undo();
                $todoList[$key] = $TodoToUndo;
                $this->storage->writeTodoList($todoList);
                return $TodoToUndo;
            }
        }
    }

    /**
     * @param $todoNum
     * @return Todo
     */
    public function getTodoByNum($todoNum)
    {
        return $this->storage->readTodoList()[$todoNum];
    }

    /**
     * @param $oldText
     * @param $newText
     * @return bool
     */
    public function updateTodo($oldText, $newText)
    {
        $oldTodo = $this->getTodoByText($oldText);
        $todoArray = $this->storage->readTodoList();
        if($oldTodo instanceof \Vascowhite\Todo\Todo){
            foreach($todoArray as $key => $todo){
                if($oldTodo->sameAs($todo)){
                    $todoArray[$key] = TodoParser::parse($newText);
                    $this->storage->writeTodoList($todoArray);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @param $todoText
     * @return Todo | null
     */
    public function getTodoByText($todoText)
    {
        $todoToFind = TodoParser::parse($todoText);
        foreach($this->storage->readTodoList() as $todo){
            if($todoToFind->sameAs($todo)){
                return $todo;
            }
        }
        return null;
    }

    /**
     * @param int $todoNum
     * @return Todo[]
     */
    public function archive($todoNum)
    {
        $todoArray = $this->storage->readTodoList();
        $todoToArchive = $this->getTodoByNum($todoNum);
        if($todoToArchive->sameAs($todoArray[$todoNum])){
            $this->storage->writeDoneTodoToArchive($todoToArchive);
            unset($todoArray[$todoNum]);
            $this->storage->writeTodoList($todoArray);
        }
        return $this->getList();
    }

    /**
     * @param int $todoNum
     * @return \array[]
     */
    public function delete($todoNum)
    {
        $todoArray = $this->storage->readTodoList();
        $todoToDelete = $this->getTodoByNum($todoNum);
        if($todoToDelete->sameAs($todoArray[$todoNum])){
            unset($todoArray[$todoNum]);
            $this->storage->writeTodoList($todoArray);
        }
        return $this->getList();
    }
}