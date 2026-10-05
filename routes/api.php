<?php

use App\Http\Controllers\Admin\AdminContentController;
use App\Http\Controllers\Admin\AdminStockController;
use App\Http\Controllers\DisplayController;
use Illuminate\Support\Facades\Route;

Route::get('/display', DisplayController::class)->name('api.display');

Route::prefix('admin')->middleware(['web', 'auth', 'role:admin'])->group(function (): void {
    Route::apiResource('stocks', AdminStockController::class)->except(['show']);
    Route::get('{resource}', [AdminContentController::class, 'index'])->where('resource', 'promotions');
    Route::post('{resource}', [AdminContentController::class, 'store'])->where('resource', 'promotions');
    Route::get('{resource}/{id}', [AdminContentController::class, 'show'])->where('resource', 'promotions')->whereNumber('id');
    Route::put('{resource}/{id}', [AdminContentController::class, 'update'])->where('resource', 'promotions')->whereNumber('id');
    Route::delete('{resource}/{id}', [AdminContentController::class, 'destroy'])->where('resource', 'promotions')->whereNumber('id');
    Route::patch('{resource}/{id}/toggle', [AdminContentController::class, 'toggle'])->where('resource', 'promotions')->whereNumber('id');
});
