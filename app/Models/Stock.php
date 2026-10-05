<?php

namespace App\Models;

use Database\Factories\StockFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'division', 'url', 'video_path', 'sort_order'])]
class Stock extends Model
{
    /** @use HasFactory<StockFactory> */
    use HasFactory;

    /**
     * Where an uploaded file lives on the public disk, relative to its root.
     */
    public const VIDEO_DIRECTORY = 'stocks';

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /**
     * The board only ever plays a local file through the streaming route, so a
     * stock counts as playable only when the upload actually landed.
     */
    public function hasVideo(): bool
    {
        return filled($this->video_path);
    }

    /**
     * The URL the board plays, or null when the stock has no uploaded file.
     */
    public function videoUrl(): ?string
    {
        return $this->hasVideo() ? route('stocks.video', $this) : null;
    }
}
