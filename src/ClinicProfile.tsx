import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Clinic = {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  description: string | null;
};

export default function ClinicProfile() {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadClinic();
  }, []);

  const loadClinic = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("You are not logged in.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(profileError);
        setMessage("Could not load your profile.");
        return;
      }

      if (!profile?.clinic_id) {
        setMessage("No clinic is connected to this account.");
        return;
      }

      setClinicId(profile.clinic_id);

      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", profile.clinic_id)
        .single();

      if (clinicError) {
        console.error(clinicError);
        setMessage("Could not load clinic information.");
        return;
      }

      setClinic(clinicData);

      setName(clinicData.name || "");
      setPhone(clinicData.phone || "");
      setWhatsapp(clinicData.whatsapp || "");
      setAddress(clinicData.address || "");
      setDescription(clinicData.description || "");

      if (clinicData.logo_url) {
        setLogoPreview(clinicData.logo_url);
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Make sure the selected file is an image
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    // Limit image size to 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5 MB.");
      return;
    }

    setLogoFile(file);

    // Preview selected image
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    setMessage("");
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !clinicId) {
      return clinic?.logo_url || null;
    }

    const fileExtension = logoFile.name.split(".").pop() || "png";

    const safeFileName = logoFile.name
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const filePath = `${clinicId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("clinic-logos")
      .upload(filePath, logoFile, {
        upsert: false,
        contentType: logoFile.type,
      });

    if (uploadError) {
      console.error(uploadError);
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("clinic-logos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!clinicId) return;

    if (!name.trim()) {
      setMessage("Clinic name is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      // Upload logo if user selected a new image
      let logoUrl = clinic?.logo_url || null;

      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      // Update clinic information
      const { error } = await supabase
        .from("clinics")
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          address: address.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl,
        })
        .eq("id", clinicId);

      if (error) {
        console.error(error);
        setMessage(error.message);
        return;
      }

      setClinic((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim(),
              phone: phone.trim() || null,
              whatsapp: whatsapp.trim() || null,
              address: address.trim() || null,
              description: description.trim() || null,
              logo_url: logoUrl,
            }
          : prev
      );

      setLogoFile(null);

      setMessage("Clinic profile saved successfully.");
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setMessage(`Logo upload failed: ${error.message}`);
      } else {
        setMessage("Something went wrong while saving.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <p className="text-gray-600">Loading clinic profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Clinic Profile
          </h1>

          <p className="text-gray-500 mb-8">
            Manage your clinic information and logo.
          </p>

          {/* Logo Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Clinic Logo
            </h2>

            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Logo Preview */}
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Clinic Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm text-center px-3">
                    No Logo
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="logo-upload"
                  className="inline-block cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium transition"
                >
                  Choose Image
                </label>

                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />

                <p className="text-sm text-gray-500 mt-3">
                  PNG, JPG, JPEG, WEBP
                </p>

                <p className="text-sm text-gray-500">
                  Maximum size: 5 MB
                </p>

                {logoFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Clinic Information */}
          <div className="space-y-5">
            {/* Clinic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinic Name *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter clinic name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>

              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Enter WhatsApp number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter clinic address"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinic Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a short description about your clinic..."
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                message.toLowerCase().includes("success")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


