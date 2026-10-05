<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminStockController extends Controller
{
    private const MAX_VIDEO_KILOBYTES = 102400;

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Stock::query()->orderBy('sort_order')->orderBy('id')->get()
                ->map(fn (Stock $stock): array => $this->serialize($stock)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request, true);
        unset($validated['video']);

        $stock = new Stock($validated);
        $stock->video_path = $this->upload($request);
        $this->ensurePlayable($stock);
        $stock->save();

        return response()->json(['success' => true, 'data' => $this->serialize($stock)], 201);
    }

    public function update(Request $request, Stock $stock): JsonResponse
    {
        $previousVideoPath = $stock->video_path;

        $validated = $this->validated($request, ! $stock->hasVideo());
        unset($validated['video']);

        $stock->fill($validated);
        $stock->video_path = $this->upload($request) ?? $previousVideoPath;
        $this->ensurePlayable($stock);
        $stock->save();

        if ($previousVideoPath && $stock->video_path !== $previousVideoPath) {
            Storage::disk('public')->delete($previousVideoPath);
        }

        return response()->json(['success' => true, 'data' => $this->serialize($stock)]);
    }

    public function destroy(Stock $stock): JsonResponse
    {
        if ($stock->video_path) {
            Storage::disk('public')->delete($stock->video_path);
        }

        $stock->delete();

        return response()->json(['success' => true, 'data' => null]);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $requireVideo): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'division' => ['required', Rule::in(['Johen PUBG', 'Monkey PUBG', 'Johen MLBB', 'Johen FC Mobile', 'Johen Free Fire', 'Johen Valorant', 'Johen E-Football'])],
            'sort_order' => ['required', 'integer', 'min:1'],
            'video' => [Rule::requiredIf($requireVideo), 'file', 'mimes:mp4,m4v,webm,mov,3gp,3gpp,avi,mpeg,mpg,mpeg4,wmv,flv,mts,m2ts,vob,ogv,ogg', 'max:'.self::MAX_VIDEO_KILOBYTES],
        ], [
            'video.mimes' => 'Tipe file video ini belum didukung. Pilih MP4, WebM, MOV, AVI, MPEG, WMV, FLV, MTS, atau OGG.',
            'video.max' => 'Ukuran video maksimal 100 MB.',
        ]);
    }

    private function upload(Request $request): ?string
    {
        if (! $request->hasFile('video')) {
            return null;
        }

        $path = $request->file('video')->store(Stock::VIDEO_DIRECTORY, 'public');

        if (! $path) {
            throw ValidationException::withMessages(['video' => 'Video gagal disimpan. Periksa ruang penyimpanan lalu coba lagi.']);
        }

        return $path;
    }

    /**
     * A stock the board cannot play is worse than a rejected one, so refuse it
     * here instead of leaving a black slide on the screen.
     */
    private function ensurePlayable(Stock $stock): void
    {
        if ($stock->hasVideo()) {
            return;
        }

        throw ValidationException::withMessages([
            'video' => 'Upload file video untuk menyimpan stock.',
        ]);
    }

    /** @return array<string, mixed> */
    private function serialize(Stock $stock): array
    {
        return [
            'id' => $stock->id,
            'title' => $stock->title,
            'division' => $stock->division,
            'video_path' => $stock->video_path,
            'video_url' => $stock->videoUrl(),
            'sort_order' => $stock->sort_order,
        ];
    }
}
