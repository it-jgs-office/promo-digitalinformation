<?php

namespace Database\Factories;

use App\Models\Stock;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stock>
 */
class StockFactory extends Factory
{
    protected $model = Stock::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'url' => fake()->url(),
            'video_path' => null,
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }
}
