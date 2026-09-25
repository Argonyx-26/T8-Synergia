import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MapPin, Phone, Search, Building2, ExternalLink } from "lucide-react";

interface Hospital {
  id: number;
  name: string;
  state: string;
  district: string;
  address: string;
  phone: string | null;
  specialty: string;
}

export default function HospitalFinder() {
  const [regions, setRegions] = useState<Record<string, string[]>>({});
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch states and districts
  useEffect(() => {
    fetch("/api/hospitals/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data))
      .catch((err) => console.error("Error loading regions:", err));
  }, []);

  // Fetch hospitals when filters change
  const handleSearch = () => {
    if (!selectedState) return;
    setLoading(true);
    let url = `/api/hospitals?state=${encodeURIComponent(selectedState)}`;
    if (selectedDistrict) {
      url += `&district=${encodeURIComponent(selectedDistrict)}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setHospitals(data);
      })
      .catch((err) => console.error("Error searching hospitals:", err))
      .finally(() => setLoading(false));
  };

  const getGoogleMapsLink = (name: string, address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
  };

  const states = Object.keys(regions).sort();
  const districts = selectedState ? regions[selectedState].sort() : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Hospital & Specialist Finder</h2>
          <p className="text-sm text-gray-500 mt-2">
            Locate top diagnostic centers and gynecologists specialized in PCOS care in India.
          </p>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Select State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("");
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
              >
                <option value="">-- Choose State --</option>
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Select District / City</label>
              <select
                value={selectedDistrict}
                disabled={!selectedState}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white disabled:opacity-50"
              >
                <option value="">-- Choose District / City (All) --</option>
                {districts.map((dst) => (
                  <option key={dst} value={dst}>
                    {dst}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={!selectedState || loading}
            className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-medium transition-all shadow-md disabled:opacity-50"
          >
            <Search className="w-4 h-4" /> {loading ? "Searching..." : "Find Specialists"}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-2"></div>
              <p className="text-gray-500 text-sm">Searching records...</p>
            </div>
          ) : hospitals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {hospitals.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-pink-100 p-2 rounded-lg text-pink-500">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{h.name}</h4>
                        <span className="inline-block bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5">
                          {h.specialty}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-gray-500 pl-9">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                      <span>{h.address}</span>
                    </div>

                    {h.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 pl-9">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{h.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pl-9 md:pl-0 shrink-0">
                    <a
                      href={getGoogleMapsLink(h.name, h.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-pink-500 hover:text-pink-600 border border-pink-200 hover:border-pink-300 bg-pink-50/50 hover:bg-pink-50 px-4 py-2 rounded-xl transition-all"
                    >
                      View on Maps <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : selectedState ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-gray-100">
              <p className="text-gray-500">No specialists matching your criteria found. Try another location.</p>
            </div>
          ) : (
            <div className="text-center py-10 bg-white/50 border border-dashed border-pink-200 rounded-3xl">
              <p className="text-gray-400 text-sm">Select a state above to begin searching hospitals.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
