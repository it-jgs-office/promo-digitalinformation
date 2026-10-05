<?php

namespace Tests\Feature;

use App\Models\Stock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StockApiTest extends TestCase
{
    use RefreshDatabase;

    private const JSON = ['Accept' => 'application/json'];

    public function test_admin_can_upload_a_video_that_the_board_plays_from_the_local_disk(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->admin()->create());

        $this->post('/api/admin/stocks', [
            'title' => 'Johen Gaming MLBB',
            'sort_order' => 1,
            'video' => UploadedFile::fake()->create('clip.mp4', 512, 'video/mp4'),
        ], self::JSON)->assertCreated()
            ->assertJsonPath('data.title', 'Johen Gaming MLBB')
            ->assertJsonPath('data.url', null)
            ->assertJsonPath('data.video_url', route('stocks.video', Stock::firstOrFail()));

        $stock = Stock::firstOrFail();
        $this->assertStringStartsWith('stocks/', $stock->video_path);
        Storage::disk('public')->assertExists($stock->video_path);
    }

    public function test_board_video_route_serves_the_upload_with_range_support(): void
    {
        Storage::fake('public');
        $stock = $this->stockWithVideo();

        $this->get(route('stocks.video', $stock))
            ->assertOk()
            ->assertHeader('Content-Type', 'video/mp4');

        // Range support is what lets the board start playing before the whole
        // file has downloaded, so a refused range is a real regression.
        $this->get(route('stocks.video', $stock), ['Range' => 'bytes=0-3'])
            ->assertStatus(206)
            ->assertHeader('Content-Range', 'bytes 0-3/64');
    }

    public function test_a_stock_without_an_upload_plays_its_direct_url(): void
    {
        Stock::factory()->create([
            'url' => 'https://cdn.example.com/clip.mp4',
            'video_path' => null,
        ]);

        $this->getJson('/api/display')->assertOk()
            ->assertJsonPath('data.0.url', 'https://cdn.example.com/clip.mp4')
            ->assertJsonPath('data.0.video_url', 'https://cdn.example.com/clip.mp4');
    }

    public function test_an_uploaded_file_takes_precedence_over_the_direct_url(): void
    {
        Storage::fake('public');
        $stock = $this->stockWithVideo();
        $stock->update(['url' => 'https://cdn.example.com/clip.mp4']);

        $this->getJson('/api/display')->assertOk()
            ->assertJsonPath('data.0.video_url', route('stocks.video', $stock));
    }

    public function test_a_stock_needs_either_an_upload_or_a_url(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->admin()->create());

        $this->post('/api/admin/stocks', [
            'title' => 'Tanpa sumber',
            'sort_order' => 1,
        ], self::JSON)->assertUnprocessable()
            ->assertJsonValidationErrors('video');

        $this->assertDatabaseCount('stocks', 0);
    }

    public function test_upload_rejects_files_that_are_not_video(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->admin()->create());

        $this->post('/api/admin/stocks', [
            'title' => 'Gambar',
            'sort_order' => 1,
            'video' => UploadedFile::fake()->image('poster.jpg'),
        ], self::JSON)->assertUnprocessable()
            ->assertJsonValidationErrors('video');

        $this->assertDatabaseCount('stocks', 0);
    }

    public function test_replacing_an_upload_removes_the_previous_file(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->admin()->create());
        $stock = $this->stockWithVideo();
        $previousPath = $stock->video_path;

        $this->post('/api/admin/stocks/'.$stock->id, [
            '_method' => 'PUT',
            'title' => 'Judul baru',
            'sort_order' => 1,
            'video' => UploadedFile::fake()->create('replacement.mp4', 512, 'video/mp4'),
        ], self::JSON)->assertOk();

        $stock->refresh();
        $this->assertNotSame($previousPath, $stock->video_path);
        Storage::disk('public')->assertMissing($previousPath);
        Storage::disk('public')->assertExists($stock->video_path);
    }

    public function test_editing_without_a_new_upload_keeps_the_existing_file(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->admin()->create());
        $stock = $this->stockWithVideo();
        $path = $stock->video_path;

        $this->post('/api/admin/stocks/'.$stock->id, [
            '_method' => 'PUT',
            'title' => 'Judul diperbarui',
            'sort_order' => 1,
        ], self::JSON)->assertOk()->assertJsonPath('data.title', 'Judul diperbarui');

        $this->assertSame($path, $stock->refresh()->video_path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_deleting_a_stock_removes_its_uploaded_file(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->admin()->create());
        $stock = $this->stockWithVideo();

        $this->deleteJson('/api/admin/stocks/'.$stock->id)->assertOk();

        $this->assertDatabaseCount('stocks', 0);
        Storage::disk('public')->assertMissing($stock->video_path);
    }

    public function test_video_route_is_public_but_hidden_for_stocks_without_a_file(): void
    {
        Storage::fake('public');
        $stock = Stock::factory()->create(['video_path' => null]);

        $this->getJson(route('stocks.video', $stock))->assertNotFound();

        $stock->update(['video_path' => 'stocks/already-deleted.mp4']);

        $this->getJson(route('stocks.video', $stock))->assertNotFound();
    }

    public function test_only_admins_can_manage_stocks(): void
    {
        $this->getJson('/api/admin/stocks')->assertUnauthorized();
        $this->actingAs(User::factory()->create())->getJson('/api/admin/stocks')->assertForbidden();
        $this->actingAs(User::factory()->admin()->create())->getJson('/api/admin/stocks')->assertOk();
    }

    private function stockWithVideo(): Stock
    {
        Storage::disk('public')->put('stocks/clip.mp4', str_repeat('a', 64));

        return Stock::factory()->create([
            'url' => null,
            'video_path' => 'stocks/clip.mp4',
        ]);
    }
}
