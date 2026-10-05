<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The board can now serve an uploaded file instead of a remote link, so a
     * stock row no longer needs a URL to be playable.
     */
    public function up(): void
    {
        Schema::table('stocks', function (Blueprint $table): void {
            $table->text('url')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('stocks')->whereNull('url')->update(['url' => '']);

        Schema::table('stocks', function (Blueprint $table): void {
            $table->text('url')->nullable(false)->change();
        });
    }
};
