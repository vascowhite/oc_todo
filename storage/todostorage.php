<?php
/**
 * ownCloud - ToDo
 *
 * @author Paul White
 * @copyright 2015 Paul White paul@vascowhite.co.uk
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * User: Paul White
 * Date: 27/04/2015
 * 
 * File: File.php
 * @package todo
 */
 
 /**
  * @package todo
  */

namespace OCA\Todo\Storage;

use OCP\Files\Folder;
use OCP\Files\IRootFolder;
use OCP\IConfig;
use Vascowhite\Todo\Todo;

class TodoStorage
{
    /**
     * Path to todo.txt
     * @var String $todoPath
     */
    private $todoPath;

    /**
     * Path to done.txt
     * @var String $donePath
     */
    private $donePath;

    /**
     * @var IRootFolder
     */
    private $storage;

    /**
     * @var string
     */
    private $appName;

    /**
     * @var string
     */
    private $userId;

    /**
     * @var IConfig
     */
    private $config;

    /**
     * The folder that todo's are kept in
     */
    const TODO_FOLDER = 'todo';

    /**
     * @param string      SAppName
     * @param string      $UserId
     * @param IRootFolder $root
     * @param IConfig     $config
     */
    public function __construct($AppName, $UserId, IRootFolder $root, IConfig $config)
    {
        $this->appName = $AppName;
        $this->userId = $UserId;
        $this->storage = $root;
        $this->config = $config;
        $this->todoPath = $this->config->getUserValue($this->userId, $this->appName, 'todoPath');
        $this->donePath = $this->config->getUserValue($this->userId, $this->appName, 'donePath');
    }


    /**
     * @return Todo[]
     * @throws \OCP\Files\NotPermittedException
     */
    public function readTodoList()
    {
        $result = [];
        $folder = $this->getFolderForUser($this->userId);
        $file = $this->getTodoFile($folder, $this->todoPath);
        $todoStrings = explode("\n", $file->getContent());
        array_pop($todoStrings);
        foreach($todoStrings as $string){
            //Skip empty lines
            if(strlen($string) > 0){
                $result[] = Todo::createFromString($string);
            }
        }
        return $result;
    }

    /**
     * @param Todo[] $todoList
     *
     */
    public function writeTodoList(array $todoList)
    {
        $folder = $this->getFolderForUser($this->userId);
        $file = $this->getTodoFile($folder, $this->todoPath);
        $saveString = '';
        foreach($todoList as $todo){
            $saveString .= $todo . "\n";
        }
        $file->putContent($saveString);
    }

    /**
     * @param Todo $doneTodo
     * @return int
     */
    public function writeDoneTodoToArchive(Todo $doneTodo)
    {
        if(!$doneTodo->getCompleted()){
            $doneTodo->done();
        }
        $folder = $this->getFolderForUser($this->userId);
        $file = $this->getTodoFile($folder, $this->donePath);
        $fh = $file->fopen('a');
        $result = fwrite($fh, $doneTodo . "\n");
        fclose($fh);

        if($result > 0){
            $result = 1;
        }
        return $result;
    }

    /**
     * @param $userId
     * @return \OCP\Files\Folder|\OCP\Files\Node
     */
    private function getFolderForUser($userId)
    {
        $path = '/' . $userId . '/files/' . self::TODO_FOLDER;
        if($this->storage->nodeExists($path)){
            $folder = $this->storage->get($path);
        } else {
            $folder = $this->storage->newFolder($path);
        }
        return $folder;
    }

    /**
     * @param Folder $folder
     * @param        $fileName
     * @return \OCP\Files\File|\OCP\Files\Node
     */
    private function getTodoFile(Folder $folder, $fileName)
    {
        if($folder->nodeExists($fileName)){
            $file = $folder->get($fileName);
        } else {
            $file = $folder->newFile($fileName);
        }
        return $file;
    }
}