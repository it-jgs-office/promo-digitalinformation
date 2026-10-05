<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class AdminDashboardController
{
    public function index(): RedirectResponse
    {
        return redirect()->route('admin.stocks');
    }

    public function stocks(): View
    {
        return view('app', ['page' => 'admin/stocks', 'props' => ['title' => 'Stock']]);
    }

    public function promotions(): View
    {
        return view('app', ['page' => 'admin/promotions', 'props' => ['resource' => 'promotions', 'title' => 'Promo']]);
    }

    public function createPromotion(): View
    {
        return view('app', ['page' => 'admin/promotion-form', 'props' => ['resource' => 'promotions', 'title' => 'Promo']]);
    }

    public function editPromotion(int $promotion): View
    {
        return view('app', ['page' => 'admin/promotion-form', 'props' => ['resource' => 'promotions', 'title' => 'Promo', 'recordId' => $promotion]]);
    }
}
