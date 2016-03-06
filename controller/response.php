<?php
/**
 * Shamelessly plagirised from https://github.com/owncloud/tasks/blob/master/controller/response.php
 */
namespace OCA\Todo\Controller;

use \Closure;
use \OCP\AppFramework\Http\JSONResponse;

trait Response
{
	protected function generateResponse(Closure $callback)
	{
		try {
			$message = [
				'status' => 'success',
				'data' => $callback(),
				'message' => null
			];

		} catch(\Exception $e) {
			$message = [
				'status' => 'error',
				'data' => null,
				'message' => $e->getMessage()
			];
		}
		return new JSONResponse($message);
	}
}