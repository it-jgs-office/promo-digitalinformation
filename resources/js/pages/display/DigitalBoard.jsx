import React, { useEffect, useState } from 'react';
import { getDisplayData } from '../../services/api.js';
import './DigitalBoard.css';

const REFRESH_INTERVAL = 45_000;
const PROMOTION_DURATION = 5_000;

function PromotionSlide({ promotion }) {
    return <img className="promotion-fullscreen-image" src={promotion.image_url} alt="" />;
}

function StockSlide({ stock, onVideoEnded }) {
    const [hasVideoError, setHasVideoError] = useState(false);

    return (
        <section className="stock-display">
            <header className="stock-heading">
                <h1>{stock.title}</h1>
            </header>
            <div className="monitor-wrap" aria-label="Pemutar video">
                <div className="monitor-frame">
                    <div className="monitor-screen">
                        {hasVideoError || !stock.video_url ? (
                            <div className="stock-video-error" role="status">
                                <p>{!stock.video_url ? 'Admin belum meng-upload file video untuk stock ini.' : 'Format atau codec video ini tidak didukung browser. Konversikan ke MP4 H.264, lalu upload ulang.'}</p>
                            </div>
                        ) : (
                            <video
                                className="stock-video"
                                src={stock.video_url}
                                title={`Video ${stock.title}`}
                                autoPlay
                                muted
                                playsInline
                                controls
                                onEnded={onVideoEnded}
                                onError={() => setHasVideoError(true)}
                            />
                        )}
                    </div>
                </div>
                <div className="monitor-neck" aria-hidden="true" />
                <div className="monitor-base" aria-hidden="true" />
            </div>
        </section>
    );
}

function BoardMessage({ hasError, loading = false }) {
    return (
        <div className="board-message">
            <span className="board-message-mark">ST</span>
            <h1>Video Stock</h1>
            <p>{loading ? 'Memuat stock...' : hasError ? 'Stock sedang diperbarui. Sistem akan mencoba kembali.' : 'Belum ada stock untuk ditampilkan.'}</p>
        </div>
    );
}

export default function DigitalBoard() {
    const [promotions, setPromotions] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
    const [fullscreenError, setFullscreenError] = useState(false);

    useEffect(() => {
        document.body.classList.add('display-mode');
        let isMounted = true;
        let refreshTimeout;
        let controller;

        async function refreshStocks() {
            controller = new AbortController();

            try {
                const payload = await getDisplayData({ signal: controller.signal });
                if (payload.success !== true || !Array.isArray(payload.data?.stocks) || !Array.isArray(payload.data?.promotions)) {
                    throw new Error('Format data stock tidak valid.');
                }

                if (isMounted) {
                    setPromotions(payload.data.promotions);
                    setStocks(payload.data.stocks);
                    setSlideIndex((index) => Math.min(index, Math.max(payload.data.promotions.length + payload.data.stocks.length - 1, 0)));
                    setHasError(false);
                }
            } catch (error) {
                if (isMounted && error.name !== 'AbortError') {
                    setHasError(true);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    refreshTimeout = window.setTimeout(refreshStocks, REFRESH_INTERVAL);
                }
            }
        }

        refreshStocks();

        return () => {
            isMounted = false;
            controller?.abort();
            window.clearTimeout(refreshTimeout);
            document.body.classList.remove('display-mode');
        };
    }, []);

    useEffect(() => {
        function syncFullscreen() {
            setIsFullscreen(Boolean(document.fullscreenElement));
        }

        document.addEventListener('fullscreenchange', syncFullscreen);
        return () => document.removeEventListener('fullscreenchange', syncFullscreen);
    }, []);

    async function toggleFullscreen() {
        if (!document.fullscreenEnabled) return;

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.querySelector('.display-shell')?.requestFullscreen();
            }
            setFullscreenError(false);
        } catch {
            setFullscreenError(true);
        }
    }

    const promotionSlides = promotions.map((promotion) => ({ type: 'promotion', data: promotion }));
    const slides = [
        ...promotionSlides,
        ...stocks.map((stock) => ({ type: 'stock', data: stock })),
    ];
    const currentSlide = slides[slideIndex];
    const isPromotionSlide = currentSlide?.type === 'promotion';
    const isMonkeyDivision = currentSlide?.type === 'stock' && currentSlide.data.division === 'Monkey PUBG';
    const isJohenMlbbDivision = currentSlide?.type === 'stock' && currentSlide.data.division === 'Johen MLBB';
    const isJohenFcMobileDivision = currentSlide?.type === 'stock' && currentSlide.data.division === 'Johen FC Mobile';
    const isJohenFreeFireDivision = currentSlide?.type === 'stock' && currentSlide.data.division === 'Johen Free Fire';
    const isJohenValorantDivision = currentSlide?.type === 'stock' && currentSlide.data.division === 'Johen Valorant';
    const isJohenEFootballDivision = currentSlide?.type === 'stock' && currentSlide.data.division === 'Johen E-Football';
    const divisionTheme = isMonkeyDivision ? 'division-monkey' : isJohenMlbbDivision ? 'division-johen-mlbb' : isJohenFcMobileDivision ? 'division-johen-fc-mobile' : isJohenFreeFireDivision ? 'division-johen-free-fire' : isJohenValorantDivision ? 'division-johen-valorant' : isJohenEFootballDivision ? 'division-johen-e-football' : 'division-johen';

    useEffect(() => {
        if (!isPromotionSlide || slides.length < 2) return undefined;
        const timeout = window.setTimeout(() => setSlideIndex((index) => (index + 1) % slides.length), PROMOTION_DURATION);
        return () => window.clearTimeout(timeout);
    }, [slideIndex, isPromotionSlide, slides.length]);

    function advanceToNextSlide() {
        if (slides.length > 1) {
            setSlideIndex((index) => (index + 1) % slides.length);
        }
    }

    return (
        <main className={`display-shell stock-board ${isPromotionSlide ? 'promotion-board' : ''} ${divisionTheme}`}>
            {hasError && <div className="display-error" role="status">Informasi stock sedang diperbarui</div>}
            {isLoading ? <BoardMessage loading /> : slides.length === 0 ? <BoardMessage hasError={hasError} /> : isPromotionSlide ? (
                <div className="display-stage promotion-fullscreen-slide" key={`promotion-${currentSlide.data.id}`}>
                    <PromotionSlide promotion={currentSlide.data} />
                </div>
            ) : (
                <div className="display-stage">
                    <StockSlide
                        key={`stock-${currentSlide.data.id}`}
                        stock={currentSlide.data}
                        onVideoEnded={advanceToNextSlide}
                    />
                </div>
            )}
            {fullscreenError && <div className="display-error" role="status">Mode layar penuh tidak dapat diaktifkan.</div>}
            {!isFullscreen && document.fullscreenEnabled && <button className="fullscreen-control" type="button" onClick={toggleFullscreen} aria-label="Tampilkan layar penuh">FULLSCREEN</button>}
        </main>
    );
}
