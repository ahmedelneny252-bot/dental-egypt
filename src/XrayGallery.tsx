import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Trash2, X } from "lucide-react";
import { supabase } from "./supabase";

type Xray = {
  id: string;
  clinic_id: string;
  patient_id: string;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
  title: string | null;
  notes: string | null;
  taken_date: string | null;
  created_at: string;
};

type Props = {
  mode: "doctor" | "patient";
  isArabic: boolean;
  // وضع الدكتور
  clinicId?: string;
  patientId?: string;
  // وضع المريض (كل ملفاته)
  patientIds?: string[];
  // بيتنادى بعد رفع ناجح (للإشعارات مثلًا)
  onUploaded?: (count: number) => void;
};

const BUCKET = "xrays";
const MAX_SIZE_MB = 15;

const todayStr = () => new Date().toISOString().split("T")[0];

const isImage = (x: Xray) => (x.mime_type || "").startsWith("image/");

export default function XrayGallery({
  mode,
  isArabic,
  clinicId,
  patientId,
  patientIds,
  onUploaded,
}: Props) {
  const isDoctor = mode === "doctor";

  const [xrays, setXrays] = useState<Xray[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [takenDate, setTakenDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const [preview, setPreview] = useState<Xray | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedOnce = useRef(false);

  const patientIdsKey = (patientIds || []).join(",");

  const load = useCallback(async () => {
    if (!loadedOnce.current) setLoading(true);

    try {
      let query = supabase
        .from("patient_xrays")
        .select(
          "id, clinic_id, patient_id, file_path, file_name, mime_type, title, notes, taken_date, created_at"
        )
        .order("created_at", { ascending: false });

      if (isDoctor) {
        if (!clinicId || !patientId) return;
        query = query
          .eq("clinic_id", clinicId)
          .eq("patient_id", patientId);
      } else {
        const ids = patientIdsKey ? patientIdsKey.split(",") : [];
        if (ids.length === 0) {
          setXrays([]);
          setUrls({});
          return;
        }
        query = query.in("patient_id", ids);
      }

      const { data, error: loadError } = await query;

      if (loadError) throw loadError;

      const rows = (data || []) as Xray[];
      setXrays(rows);

      if (rows.length > 0) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(
            rows.map((r) => r.file_path),
            60 * 60
          );

        const map: Record<string, string> = {};

        (signed || []).forEach((item) => {
          if (item.path && item.signedUrl) {
            map[item.path] = item.signedUrl;
          }
        });

        setUrls(map);
      } else {
        setUrls({});
      }

      setError("");
      loadedOnce.current = true;
    } catch (err: any) {
      console.error("X-rays load error:", err);

      setError(
        isArabic
          ? `تعذر تحميل صور الأشعة: ${err?.message || ""}`
          : `Could not load X-rays: ${err?.message || ""}`
      );
    } finally {
      setLoading(false);
    }
  }, [isDoctor, clinicId, patientId, patientIdsKey, isArabic]);

  useEffect(() => {
    load();
  }, [load]);

  // تحديث لحظي لما الدكتور يرفع/يحذف
  useEffect(() => {
    if (isDoctor) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const bump = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(load, 400);
    };

    const channel = supabase
      .channel("patient-xrays-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patient_xrays" },
        bump
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [isDoctor, load]);

  const resetForm = () => {
    setFiles([]);
    setTitle("");
    setTakenDate(todayStr());
    setNotes("");
    setShowForm(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);

    const invalid = picked.find(
      (f) =>
        !(f.type.startsWith("image/") || f.type === "application/pdf")
    );

    if (invalid) {
      setError(
        isArabic
          ? "الملفات المسموحة: صور (JPG, PNG, ...) أو PDF فقط."
          : "Only images (JPG, PNG, ...) or PDF files are allowed."
      );
      return;
    }

    const tooBig = picked.find(
      (f) => f.size > MAX_SIZE_MB * 1024 * 1024
    );

    if (tooBig) {
      setError(
        isArabic
          ? `حجم الملف يجب ألا يزيد عن ${MAX_SIZE_MB} ميجا.`
          : `File size must not exceed ${MAX_SIZE_MB} MB.`
      );
      return;
    }

    setError("");
    setFiles(picked);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicId || !patientId) return;

    if (files.length === 0) {
      setError(
        isArabic
          ? "اختر صورة أشعة واحدة على الأقل."
          : "Choose at least one X-ray image."
      );
      return;
    }

    setUploading(true);
    setError("");

    let uploaded = 0;

    try {
      for (const file of files) {
        const ext =
          (file.name.split(".").pop() || "jpg")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") || "jpg";

        const path = `${clinicId}/${patientId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from("patient_xrays")
          .insert({
            clinic_id: clinicId,
            patient_id: patientId,
            file_path: path,
            file_name: file.name,
            mime_type: file.type,
            title: title.trim() || null,
            notes: notes.trim() || null,
            taken_date: takenDate || null,
          });

        if (insertError) {
          // نمسح الملف المرفوع لو تسجيله فشل
          await supabase.storage.from(BUCKET).remove([path]);
          throw insertError;
        }

        uploaded += 1;
      }

      resetForm();
      await load();
      onUploaded?.(uploaded);
    } catch (err: any) {
      console.error("X-ray upload error:", err);

      const message: string = err?.message || "";

      let hint = "";

      if (
        err?.code === "42P01" ||
        message.includes("schema cache") ||
        message.toLowerCase().includes("bucket not found")
      ) {
        hint = isArabic
          ? "جدول أو مخزن الأشعة مش موجود في Supabase. شغّل ملف SQL الخاص بالأشعة."
          : "The X-ray table or bucket is missing in Supabase. Run the X-ray SQL file.";
      } else if (
        err?.code === "42501" ||
        message.toLowerCase().includes("row-level security") ||
        message.toLowerCase().includes("violates")
      ) {
        hint = isArabic
          ? "مفيش صلاحية للرفع. شغّل ملف SQL الخاص بالأشعة."
          : "No permission to upload. Run the X-ray SQL file.";
      }

      setError(`${hint}${hint ? " " : ""}(${message})`);

      if (uploaded > 0) await load();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (xray: Xray) => {
    const confirmed = window.confirm(
      isArabic
        ? "هل أنت متأكد من حذف هذه الأشعة؟"
        : "Are you sure you want to delete this X-ray?"
    );

    if (!confirmed) return;

    setError("");

    const { error: deleteRowError } = await supabase
      .from("patient_xrays")
      .delete()
      .eq("id", xray.id);

    if (deleteRowError) {
      setError(deleteRowError.message);
      return;
    }

    await supabase.storage.from(BUCKET).remove([xray.file_path]);

    await load();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";

    try {
      return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(date));
    } catch {
      return date;
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {isArabic ? "الأشعة والصور" : "X-Rays & Images"}
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isDoctor
              ? isArabic
                ? "ارفع صور الأشعة وهتظهر للمريض في ملفه الطبي."
                : "Upload X-ray images and they will appear in the patient's medical file."
              : isArabic
              ? "الأشعة والصور الطبية المضافة من العيادة."
              : "X-rays and medical images added by the clinic."}
          </p>
        </div>

        {isDoctor && (
          <button
            type="button"
            onClick={() => {
              setError("");
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
          >
            <ImagePlus className="h-5 w-5" />
            {showForm
              ? isArabic
                ? "إلغاء"
                : "Cancel"
              : isArabic
              ? "+ إضافة أشعة"
              : "+ Add X-ray"}
          </button>
        )}
      </div>

      {isDoctor && showForm && (
        <div className="border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/50">
          <form
            onSubmit={handleUpload}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isArabic
                  ? "اختر صورة/صور الأشعة"
                  : "Choose X-ray image(s)"}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handlePickFiles}
                className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-700 file:me-4 file:rounded-lg file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              />

              {files.length > 0 && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic
                    ? `تم اختيار ${files.length} ملف`
                    : `${files.length} file(s) selected`}
                </p>
              )}
            </div>

            <input
              type="text"
              placeholder={
                isArabic
                  ? "عنوان الأشعة - مثال: بانوراما"
                  : "Title - e.g. Panoramic"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            <input
              type="date"
              value={takenDate}
              onChange={(e) => setTakenDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            <textarea
              placeholder={
                isArabic ? "ملاحظات (اختياري)" : "Notes (optional)"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white md:col-span-2"
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 md:col-span-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            >
              {uploading
                ? isArabic
                  ? "جاري الرفع..."
                  : "Uploading..."
                : isArabic
                ? "رفع الأشعة"
                : "Upload"}
            </button>
          </form>
        </div>
      )}

      {error && !showForm && (
        <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-400" />
          </div>
        ) : xrays.length === 0 ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <ImagePlus className="h-6 w-6" />
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isArabic
                ? "لا توجد أشعة حتى الآن."
                : "No X-rays yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {xrays.map((xray) => {
              const url = urls[xray.file_path];

              return (
                <div
                  key={xray.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!url) return;

                      if (isImage(xray)) {
                        setPreview(xray);
                      } else {
                        window.open(url, "_blank", "noopener");
                      }
                    }}
                    className="flex aspect-square w-full items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-900"
                  >
                    {url && isImage(xray) ? (
                      <img
                        src={url}
                        alt={xray.title || xray.file_name || "X-ray"}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-10 w-10 text-slate-400" />
                    )}
                  </button>

                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {xray.title ||
                        xray.file_name ||
                        (isArabic ? "أشعة" : "X-ray")}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(xray.taken_date || xray.created_at)}
                    </p>

                    {xray.notes && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                        {xray.notes}
                      </p>
                    )}

                    {isDoctor && (
                      <button
                        type="button"
                        onClick={() => handleDelete(xray)}
                        className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isArabic ? "حذف" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* عرض الصورة بحجم كبير */}
      {preview && urls[preview.file_path] && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label={isArabic ? "إغلاق" : "Close"}
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={urls[preview.file_path]}
            alt={preview.title || preview.file_name || "X-ray"}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </section>
  );
}