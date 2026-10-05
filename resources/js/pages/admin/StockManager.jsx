import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import { apiRequest } from '../../services/api.js';

const emptyStock = { title: '', division: 'Johen PUBG', sort_order: 1 };
const stockDivisions = ['Johen PUBG', 'Monkey PUBG', 'Johen MLBB', 'Johen FC Mobile', 'Johen Free Fire', 'Johen Valorant', 'Johen E-Football'];

export default function StockManager() {
    const [stocks, setStocks] = useState([]);
    const [form, setForm] = useState(emptyStock);
    const [videoFile, setVideoFile] = useState(null);
    const [hasCurrentUpload, setHasCurrentUpload] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [isSaving, setIsSaving] = useState(false);

    async function loadStocks() {
        try {
            const loadedStocks = await apiRequest('/api/admin/stocks');

            setStocks(loadedStocks);
            setForm((currentForm) => {
                if (currentForm.title) {
                    return currentForm;
                }

                const nextOrder = loadedStocks.reduce((highestOrder, stock) => Math.max(highestOrder, stock.sort_order), 0) + 1;

                return { ...currentForm, sort_order: nextOrder };
            });

            return true;
        } catch (error) {
            setMessage(error.message);
            setMessageType('error');
            return false;
        }
    }

    useEffect(() => {
        loadStocks();
    }, []);

    function resetForm() {
        const nextOrder = stocks.reduce((highestOrder, stock) => Math.max(highestOrder, stock.sort_order), 0) + 1;

        setForm({ ...emptyStock, sort_order: nextOrder });
        setVideoFile(null);
        setHasCurrentUpload(false);
        setFileInputKey((key) => key + 1);
        setEditingId(null);
        setErrors({});
    }

    async function saveStock(event) {
        event.preventDefault();

        if (!videoFile && !hasCurrentUpload) {
            setErrors({ video: ['Pilih file video untuk menyimpan stock.'] });
            return;
        }

        setIsSaving(true);
        setErrors({});
        setMessage('');

        try {
            const body = new FormData();
            body.append('title', form.title);
            body.append('division', form.division);
            body.append('sort_order', form.sort_order);

            if (videoFile) {
                body.append('video', videoFile);
            }

            await apiRequest(editingId ? `/api/admin/stocks/${editingId}` : '/api/admin/stocks', {
                method: editingId ? 'PUT' : 'POST',
                body,
            });
            resetForm();
            if (await loadStocks()) {
                setMessage(editingId ? 'Stock berhasil diperbarui.' : 'Stock berhasil ditambahkan.');
                setMessageType('success');
            }
        } catch (error) {
            setErrors(error.errors || {});
            setMessage(error.message);
            setMessageType('error');
        } finally {
            setIsSaving(false);
        }
    }

    function editStock(stock) {
        setEditingId(stock.id);
        setForm({ title: stock.title, division: stock.division || 'Johen PUBG', sort_order: stock.sort_order });
        setVideoFile(null);
        setHasCurrentUpload(Boolean(stock.video_path));
        setFileInputKey((key) => key + 1);
        setErrors({});
    }

    async function deleteStock(stock) {
        if (!window.confirm(`Hapus stock "${stock.title}"?`)) {
            return;
        }

        try {
            await apiRequest(`/api/admin/stocks/${stock.id}`, { method: 'DELETE' });
            if (await loadStocks()) {
                setMessage('Stock berhasil dihapus.');
                setMessageType('success');
            }
        } catch (error) {
            setMessage(error.message);
            setMessageType('error');
        }
    }

    return (
        <AdminLayout title="Stock">
            <section className="admin-page-intro">
                <div>
                    <p className="eyebrow">MEDIA LIBRARY</p>
                    <h2>Kelola video stock</h2>
                    <p>Atur video yang diputar di layar utama. Nomor urut terkecil akan diputar lebih dulu.</p>
                </div>
                <div className="admin-stat-card"><span>Total video</span><strong>{stocks.length}</strong></div>
            </section>
            {message && <p className={`notice ${messageType === 'error' ? 'notice-error' : 'notice-success'}`} role="status">{message}</p>}
            <div className="stock-workspace">
                <form className="content-form stock-editor" onSubmit={saveStock}>
                    <div className="admin-section-heading">
                        <div><span className="section-index">{editingId ? 'EDIT' : '01'}</span><h2>{editingId ? 'Perbarui video' : 'Tambah video baru'}</h2></div>
                        <p>{editingId ? 'Simpan perubahan pada video terpilih.' : 'Lengkapi informasi untuk menambahkan video ke playlist.'}</p>
                    </div>
                    <div className="form-grid">
                    <label>
                        Judul stock
                        <input required maxLength="255" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                        {errors.title && <small className="field-error">{errors.title[0]}</small>}
                    </label>
                    <label>
                        Divisi
                        <select required value={form.division} onChange={(event) => setForm({ ...form, division: event.target.value })}>
                            {stockDivisions.map((division) => <option key={division} value={division}>{division}</option>)}
                        </select>
                        {errors.division && <small className="field-error">{errors.division[0]}</small>}
                    </label>
                    <label>
                        Urutan tampil
                        <input required type="number" min="1" step="1" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} />
                        <small>Angka lebih kecil diputar lebih dulu.</small>
                        {errors.sort_order && <small className="field-error">{errors.sort_order[0]}</small>}
                    </label>
                    <label className="span-two stock-upload-field">
                        Upload video
                        <input key={fileInputKey} type="file" required={!hasCurrentUpload} accept=".mp4,.m4v,.webm,.mov,.3gp,.3gpp,.avi,.mpeg,.mpg,.mpeg4,.wmv,.flv,.mts,.m2ts,.vob,.ogv,.ogg,video/*" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} />
                        <small>Format video umum didukung, maksimal 100 MB. Browser tertentu mungkin memerlukan konversi ke MP4 H.264.{hasCurrentUpload ? ' Upload file baru untuk mengganti video saat ini.' : ''}</small>
                        {errors.video && <small className="field-error">{errors.video[0]}</small>}
                    </label>
                </div>
                <div className="form-actions">
                    <button className="button" type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah stock'}</button>
                    {editingId && <button className="button button-light" type="button" onClick={resetForm}>Batal edit</button>}
                </div>
                </form>
                <section className="stock-library">
                    <div className="admin-section-heading">
                        <div><span className="section-index">02</span><h2>Playlist video</h2></div>
                        <p>{stocks.length} video tersimpan</p>
                    </div>
            {stocks.length === 0 ? (
                <section className="empty-state"><span>01</span><h2>Playlist masih kosong</h2><p>Tambahkan video menggunakan formulir di samping untuk mulai mengisi playlist.</p></section>
            ) : (
                <ol className="stock-list">{stocks.map((stock) => (
                    <li className={`stock-list-item ${editingId === stock.id ? 'is-editing' : ''}`} key={stock.id}>
                        <span className="stock-order">{String(stock.sort_order).padStart(2, '0')}</span>
                        <div className="stock-item-copy"><small className="stock-division-tag">{stock.division || 'Johen PUBG'}</small><strong>{stock.title}</strong><span>{stock.video_path ? 'Video siap diputar' : 'Video belum di-upload'}</span></div>
                        <div className="stock-item-actions">
                            {stock.video_url && <a href={stock.video_url} target="_blank" rel="noreferrer" aria-label={`Lihat video ${stock.title}`}>Lihat</a>}
                            <button type="button" onClick={() => editStock(stock)}>Edit</button>
                            <button className="danger" type="button" onClick={() => deleteStock(stock)}>Hapus</button>
                        </div>
                    </li>
                ))}</ol>
            )}
                </section>
            </div>
        </AdminLayout>
    );
}
