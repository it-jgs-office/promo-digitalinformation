<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serves uploaded stock videos to the public board.
 *
 * The file is resolved from the stock row instead of the request, so a caller
 * can never point this route at an arbitrary path on the public disk.
 */
class StockVideoController extends Controller
{
    /**
     * Content sniffing reports text/plain or octet-stream for plenty of real
     * video containers, and a browser refuses to play anything it is not told is
     * video. The upload validator already limits the board to these extensions,
     * so naming the type outright is both cheaper and more dependable.
     */
    private const CONTENT_TYPES = [
        'mp4' => 'video/mp4',
        'm4v' => 'video/mp4',
        'mpeg4' => 'video/mp4',
        'webm' => 'video/webm',
        'mov' => 'video/quicktime',
        '3gp' => 'video/3gpp',
        '3gpp' => 'video/3gpp',
        'avi' => 'video/x-msvideo',
        'mpeg' => 'video/mpeg',
        'mpg' => 'video/mpeg',
        'vob' => 'video/mpeg',
        'wmv' => 'video/x-ms-wmv',
        'flv' => 'video/x-flv',
        'mts' => 'video/mp2t',
        'm2ts' => 'video/mp2t',
        'ogv' => 'video/ogg',
        'ogg' => 'video/ogg',
    ];

    public function __invoke(Stock $stock): BinaryFileResponse
    {
        abort_unless($stock->hasVideo(), 404);

        $path = Storage::disk('public')->path($stock->video_path);

        abort_unless(is_file($path), 404);

        $response = new BinaryFileResponse($path);
        $response->headers->set('Content-Type', $this->contentType($stock->video_path));

        // Revalidate on every load so a re-upload replaces the file on the
        // board immediately; the ETag still turns that into a cheap 304.
        $response->headers->set('Cache-Control', 'private, no-cache');

        return $response;
    }

    private function contentType(string $videoPath): string
    {
        return self::CONTENT_TYPES[strtolower(pathinfo($videoPath, PATHINFO_EXTENSION))] ?? 'video/mp4';
    }
}
