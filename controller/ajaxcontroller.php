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
 * Date: 28/04/2015
 * 
 * File: ajaxcontroller.php
 * @package todo
 */
 
 /**
  * @package todo
  */

namespace OCA\Todo\Controller;
use OCA\Todo\Service\TodoService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;
use OCP\IConfig;
use Vascowhite\Todo\Todo;

class AjaxController extends Controller
{
    use Response;

    /**
     * @var TodoService
     */
    private $service;

    /**
     * @var string
     */
    private $userId;

    /**
     * @var IConfig
     */
    private $config;

    /**
     * @param string      $AppName
     * @param IRequest    $request
     * @param TodoService $service
     * @param string      $UserId
     * @param IConfig     $config
     */
    public function __construct($AppName, IRequest $request, TodoService $service, $UserId, IConfig $config)
    {
        parent::__construct($AppName, $request);
        $this->service = $service;
        $this->userId = $UserId;
        $this->config = $config;
    }

    /**
     * @NoAdminRequired
     *
     * @return JSONResponse
     */
    public function get()
    {
        return $this->generateResponse(function(){
            return $this->service->getList();
        });
    }

    /**
     * @NoAdminRequired
     *
     * @param string $todoText
     *
     * @return JSONResponse
     */
    public function addTodo($todoText)
    {
        //New todo's are passed base64 encoded to avoid url problems
        $todoText = base64_decode($todoText);
        $todo = Todo::createFromString($todoText);
        return $this->generateResponse(function() use($todo){
            return $this->service->todoToArray($this->service->addTodo($todo));
        });
    }

    /**
     * @NoAdminRequired
     *
     * @param int $todoNum
     *
     * @return JSONResponse
     */
    public function doTodo($todoNum)
    {
        $doneTodo = $this->service->doTodo($this->service->getTodoByNum($todoNum));
        return new JSONResponse($this->service->todoToArray($doneTodo));
    }

    /**
     * @NoAdminRequired
     *
     * @param int $todoNum
     *
     * @return JSONResponse
     */
    public function undoTodo($todoNum)
    {
        $undoneTodo = $this->service->undoTodo($this->service->getTodoByNum($todoNum));
        return new JSONResponse($this->service->todoToArray($undoneTodo));
    }

    /**
     * @NoAdminRequired
     *
     * @param int $todoNum
     * @param string $newText
     *
     * @return JSONResponse
     */
    public function updateTodo($todoNum, $newText)
    {
        $oldText = $this->service->getTodoByNum($todoNum);
        $newText = trim(base64_decode($newText));

        $result = $this->service->updateTodo($oldText, $newText);
        if($result){
            $response = new JSONResponse($this->service->todoToArray($this->service->getTodoByNum($todoNum)));
        } else {
            $response = new JSONResponse([
                'error' => 'No match',
                'text' => 'Could not find "' . $oldText . '"',
            ]);
            $response->setStatus(Http::STATUS_NOT_FOUND);
        }

        return $response;
    }

    /**
     * @NoAdminRequired
     *
     * @return JSONResponse
     */
    public function getProjects()
    {
        return $this->generateResponse(function(){
            return $this->service->getProjects();
        });
    }

    /**
     * @NoAdminRequired
     *
     * @return JSONResponse
     */
    public function getContexts()
    {
        return $this->generateResponse(function(){
            return $this->service->getContexts();
        });
    }

    /**
     * @NoAdminRequired
     *
     * @param int $todoNum
     * @return JSONResponse
     */
    public function archive($todoNum)
    {
        return new JSONResponse($this->service->archive($todoNum));
    }

    /**
     * @NoAdminRequired
     *
     * @param int $todoNum
     * @return JSONResponse
     */
    public function delete($todoNum)
    {
        return new JSONResponse($this->service->delete($todoNum));
    }
}