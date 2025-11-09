<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class InvalidWebhookSignatureException extends HttpException
{
    public function __construct(string $message = 'Invalid webhook signature.', \Throwable $previous = null)
    {
        parent::__construct(400, $message, $previous);
    }
}
