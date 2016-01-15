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
 * Date: 30/12/2015
 *
 * File: TodoStorageTest.php
 * @package todo
 */

/**
 * @package
 */

namespace OCA\Tests\Storage;

use OCA\Todo\Storage\TodoStorage;
use OCP\Files\IRootFolder;
use OCP\IConfig;

class TodoStorageTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @var IRootFolder
     */
    private $mockRootFolder;

    /**
     * @var IConfig
     */
    private $mockConfig;

    /**
     * @var TodoStorage
     */
    private $testStorage;

    protected function setUp()
    {
        $this->mockRootFolder = $this->getMockBuilder('OCP\Files\IRootFolder')->disableOriginalConstructor()->getMock();
        $this->mockConfig = $this->getMockBuilder('OCP\IConfig')->disableOriginalConstructor()->getMock();
        $this->testStorage = new TodoStorage('testing', 'testing', $this->mockRootFolder, $this->mockConfig);
    }


    public function testCanInstantiate()
    {

        $this->assertInstanceOf('OCA\Todo\Storage\TodoStorage', $this->testStorage);
    }
}
