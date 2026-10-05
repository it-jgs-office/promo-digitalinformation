<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\StockVideoController;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Support\Facades\Route;

Route::view('/', 'app', ['page' => 'display'])->name('display');
Route::get('/media/stocks/{stock}/video', StockVideoController::class)->name('stocks.video');

Route::middleware('guest')->group(function (): void {
    Route::get('/admin/login', [AdminAuthController::class, 'showLogin'])->name('admin.login');
    Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('admin.login.store');
});

Route::middleware(['auth', EnsureUserIsAdmin::class])->group(function (): void {
    Route::get('/admin', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/stocks', [AdminDashboardController::class, 'stocks'])->name('admin.stocks');
    Route::get('/admin/promotions', [AdminDashboardController::class, 'promotions'])->name('admin.promotions');
    Route::get('/admin/promotions/create', [AdminDashboardController::class, 'createPromotion'])->name('admin.promotions.create');
    Route::get('/admin/promotions/{promotion}/edit', [AdminDashboardController::class, 'editPromotion'])->whereNumber('promotion')->name('admin.promotions.edit');
    Route::post('/admin/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');
});
