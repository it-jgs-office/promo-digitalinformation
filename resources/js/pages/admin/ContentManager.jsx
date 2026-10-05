import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import { apiRequest } from '../../services/api.js';

const configs = {
    promotions: {
        fields: [
            ['title', 'Judul promo', 'text', true],
            ['start_date', 'Tanggal mulai', 'date'],
            ['end_date', 'Tanggal selesai', 'date'],
            ['image', 'Foto banner', 'file', true],
        ],
    },
};

const fileRules = {
    promotions: {
        accept: '.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif',
        hint: 'JPG, PNG, WebP, atau GIF. Maksimal 50 MB.',
    },
};

const api = (resource) => `/api/admin/${resource}`;
const displayDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`)) : 'Tanpa batas';

function PromotionIndex({ resource, title }) {
    const [records, setRecords] = useState({ data: [], current_page: 1, last_page: 1, total: 0, prev_page_url: null, next_page_url: null });
    const [error, setError] = useState('');
    const [notice, setNotice] = useState(() => window.sessionStorage.getItem('cms-success') || '');
    const [busy, setBusy] = useState(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    async function load() {
        setIsLoading(true);
        try {
            const result = await apiRequest(`${api(resource)}?${new URLSearchParams({ page: String(page) })}`);
            setRecords(result);
            setError('');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (notice) window.sessionStorage.removeItem('cms-success');
    }, []);
    useEffect(() => {
        load();
    }, [resource, page]);

    async function action(record, verb) {
        if (verb === 'DELETE' && !window.confirm(`Hapus promo “${record.title}”?`)) return;
        setBusy(record.id);
        try {
            await apiRequest(`${api(resource)}/${record.id}${verb === 'PATCH' ? '/toggle' : ''}`, { method: verb });
            setNotice(verb === 'DELETE' ? 'Promo berhasil dihapus.' : 'Status promo berhasil diperbarui.');
            await load();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setBusy(null);
        }
    }

    const activeCount = records.data.filter((record) => record.is_active).length;

    return (
        <AdminLayout title={title}>
            <section className="admin-page-intro">
                <div>
                    <p className="eyebrow">CAMPAIGN MANAGER</p>
                    <h2>Kelola banner promo</h2>
                    <p>Atur banner yang tampil di layar utama beserta periode penayangannya.</p>
                </div>
                <a className="button" href={`/admin/${resource}/create`}>＋ Tambah promo</a>
            </section>

            <section className="admin-summary-row" aria-label="Ringkasan promo">
                <div className="admin-summary-card"><span>Total promo</span><strong>{records.total}</strong><small>Seluruh banner tersimpan</small></div>
                <div className="admin-summary-card"><span>Aktif di halaman ini</span><strong>{activeCount}</strong><small>Siap tampil sesuai jadwal</small></div>
                <div className="admin-summary-card"><span>Penayangan</span><strong>Banner</strong><small>Gambar tampil penuh di layar user</small></div>
            </section>

            {error && <p className="notice notice-error" role="alert">{error}</p>}
            {notice && <p className="notice notice-success" role="status">{notice}</p>}

            <section className="admin-content-section">
                <div className="admin-section-heading">
                    <div><span className="section-index">01</span><h2>Daftar promo</h2></div>
                    <p>{records.total} banner</p>
                </div>
                {isLoading ? <div className="admin-loading" role="status">Memuat daftar promo...</div> : records.data.length === 0 ? (
                    <div className="admin-empty-state">
                        <span className="empty-illustration">＋</span>
                        <h3>Belum ada promo</h3>
                        <p>Tambahkan banner pertama. Judul hanya terlihat di menu admin.</p>
                        <a className="button" href={`/admin/${resource}/create`}>Tambah promo pertama</a>
                    </div>
                ) : (
                    <div className="promotion-grid">
                        {records.data.map((record) => (
                            <article className="promotion-card" key={record.id}>
                                <div className="promotion-card-image">
                                    {record.image_url ? <img src={record.image_url} alt={`Banner ${record.title}`} loading="lazy" /> : <span>Banner belum tersedia</span>}
                                    <span className={`status-pill ${record.is_active ? 'active' : 'inactive'}`}>{record.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                </div>
                                <div className="promotion-card-body">
                                    <div className="promotion-card-title"><div><small>JUDUL PROMO</small><h3>{record.title}</h3></div><span className="promotion-id">#{record.id}</span></div>
                                    <div className="promotion-date-range"><span><small>Mulai</small><strong>{displayDate(record.start_date)}</strong></span><span aria-hidden="true">→</span><span><small>Selesai</small><strong>{displayDate(record.end_date)}</strong></span></div>
                                    <div className="promotion-card-actions">
                                        <a className="button button-light" href={`/admin/${resource}/${record.id}/edit`}>Edit promo</a>
                                        <button className="button button-light" disabled={busy === record.id} onClick={() => action(record, 'PATCH')}>{record.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                                        <button className="icon-action danger" aria-label={`Hapus promo ${record.title}`} disabled={busy === record.id} onClick={() => action(record, 'DELETE')}>Hapus</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
                {records.total > 0 && <div className="pagination"><span>Halaman {records.current_page} dari {records.last_page}</span><div><button disabled={!records.prev_page_url} onClick={() => setPage(page - 1)}>Sebelumnya</button><button disabled={!records.next_page_url} onClick={() => setPage(page + 1)}>Berikutnya</button></div></div>}
            </section>
        </AdminLayout>
    );
}

function PromotionForm({ resource, title, recordId }) {
    const fields = configs[resource]?.fields || [];
    const [values, setValues] = useState({ is_active: true });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (recordId) {
            apiRequest(`${api(resource)}/${recordId}`)
                .then((data) => setValues({ ...data, start_date: data.start_date?.slice(0, 10), end_date: data.end_date?.slice(0, 10) }))
                .catch((requestError) => setMessage(requestError.message));
        }
    }, [resource, recordId]);

    function change(name, value) {
        setValues((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: null }));
    }

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setErrors({});
        setMessage('');
        const form = event.currentTarget;
        const body = new FormData();
        fields.forEach(([name, , type]) => {
            if (type === 'file') {
                if (form.elements[name].files[0]) body.append(name, form.elements[name].files[0]);
            } else if (values[name] !== undefined && values[name] !== null) {
                body.append(name, values[name]);
            }
        });
        body.append('is_active', values.is_active ? '1' : '0');
        try {
            await apiRequest(recordId ? `${api(resource)}/${recordId}` : api(resource), { method: recordId ? 'PUT' : 'POST', body });
            window.sessionStorage.setItem('cms-success', recordId ? 'Perubahan promo berhasil disimpan.' : 'Promo berhasil ditambahkan.');
            window.location.assign(`/admin/${resource}`);
        } catch (requestError) {
            setErrors(requestError.errors || {});
            setMessage(requestError.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout title={`${recordId ? 'Edit' : 'Tambah'} ${title}`}>
            <section className="admin-page-intro form-intro">
                <div><p className="eyebrow">CAMPAIGN MANAGER</p><h2>{recordId ? 'Perbarui promo' : 'Buat promo baru'}</h2><p>Banner tampil di layar user. Judul dan jadwal hanya untuk pengelolaan admin.</p></div>
                <a className="button button-light" href={`/admin/${resource}`}>← Kembali ke promo</a>
            </section>
            {message && <p className="notice notice-error" role="alert">{message}</p>}
            <form className="content-form promotion-form" onSubmit={submit}>
                <div className="admin-section-heading"><div><span className="section-index">01</span><h2>Informasi promo</h2></div><p>Isi judul dan pilih banner yang akan ditampilkan.</p></div>
                <div className="form-grid">
                    {fields.map(([name, label, type, required]) => (
                        <label className={type === 'file' ? 'span-two promotion-upload' : ''} key={name}>
                            <span>{label}{required && <em className="required-marker">Wajib</em>}</span>
                            {type === 'file' ? <>
                                <input type="file" name={name} accept={fileRules.promotions.accept} required={!recordId && required} onChange={() => setErrors((current) => ({ ...current, [name]: null }))} />
                                <small>{fileRules.promotions.hint}</small>
                                {values[`${name}_url`] && <img className="form-preview" src={values[`${name}_url`]} alt="Pratinjau banner saat ini" />}
                            </> : <input type={type} required={required} value={values[name] ?? ''} onChange={(event) => change(name, event.target.value)} />}
                            {errors[name] && <small className="field-error">{errors[name][0]}</small>}
                        </label>
                    ))}
                    <label className="checkbox-field"><input type="checkbox" checked={Boolean(values.is_active)} onChange={(event) => change('is_active', event.target.checked)} />Aktifkan promo</label>
                </div>
                <div className="form-actions"><button className="button" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : recordId ? 'Simpan perubahan' : 'Simpan promo'}</button><a className="button button-light" href={`/admin/${resource}`}>Batal</a></div>
            </form>
        </AdminLayout>
    );
}

export function ResourcePage(props) {
    return <PromotionIndex {...props} />;
}

export function ResourceFormPage(props) {
    return <PromotionForm {...props} />;
}
