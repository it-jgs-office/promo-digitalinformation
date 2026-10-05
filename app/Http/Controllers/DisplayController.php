<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use App\Models\Stock;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class DisplayController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'promotions' => Promotion::query()->where('is_active', true)
                    ->whereNotNull('image')
                    ->where(fn ($query) => $query->whereNull('start_date')->orWhereDate('start_date', '<=', today()))
                    ->where(fn ($query) => $query->whereNull('end_date')->orWhereDate('end_date', '>=', today()))
                    ->orderBy('sort_order')->orderBy('id')->get(['id', 'image'])
                    ->map(fn (Promotion $promotion): array => [
                        'id' => $promotion->id,
                        'image_url' => Storage::disk('public')->url($promotion->image),
                    ]),
                'stocks' => Stock::query()->orderBy('sort_order')->orderBy('id')->get(['id', 'title', 'division', 'video_path'])
                    ->map(fn (Stock $stock): array => [
                        'id' => $stock->id,
                        'title' => $stock->title,
                        'division' => $stock->division,
                        'video_url' => $stock->videoUrl(),
                    ]),
            ],
        ]);
    }
}
