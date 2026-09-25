import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Building2, MapPin, Phone, Search, ExternalLink, Sparkles } from "lucide-react";

interface Hospital {
  id: number;
  name: string;
  state: string;
  district: string;
  address: string;
  phone: string | null;
  specialty: string;
}

export default function HospitalsTab() {
  const [regions, setRegions] = useState<Record<string, string[]>>({
    Karnataka: ["Bengaluru", "Mangaluru", "Mysuru"],
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Delhi: ["New Delhi", "North Delhi"],
    "Tamil Nadu": ["Chennai", "Coimbatore"],
    Telangana: ["Hyderabad"],
  });

  const [selectedState, setSelectedState] = useState("Karnataka");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  // Fallback initial dataset of top specialized Indian clinics
  const fallbackHospitals: Hospital[] = [
    { id: 1, name: "Manipal Hospital", state: "Karnataka", district: "Bengaluru", address: "98, HAL Old Airport Rd, Kodihalli, Bengaluru", phone: "+91-80-2502-4444", specialty: "Gynecology & PCOS Endocrinology" },
    { id: 2, name: "Cloudnine Hospital", state: "Karnataka", district: "Bengaluru", address: "1533, 9th Main Rd, 3rd Block, Jayanagar, Bengaluru", phone: "+91-80-6799-6000", specialty: "Women's Health & Ovulation Clinic" },
    { id: 3, name: "Fortis Hospital", state: "Karnataka", district: "Bengaluru", address: "154/9, Bannerghatta Road, Opposite IIM-B, Bengaluru", phone: "+91-80-6621-4444", specialty: "Obstetrics & Reproductive Health" },
    { id: 4, name: "Jaslok Hospital", state: "Maharashtra", district: "Mumbai", address: "15, Dr. Deshmukh Marg, Pedder Rd, Mumbai", phone: "+91-22-6657-3333", specialty: "PCOS Specialized Endocrinology" },
    { id: 5, name: "Kokilaben Dhirubhai Ambani Hospital", state: "Maharashtra", district: "Mumbai", address: "Rao Saheb Patwardhan Marg, Andheri West, Mumbai", phone: "+91-22-4269-6969", specialty: "Advanced Gynecological Care" },
    { id: 6, name: "Sahyadri Super Speciality Hospital", state: "Maharashtra", district: "Pune", address: "Plot No. 30C, Karve Rd, Deccan Gymkhana, Pune", phone: "+91-20-6721-3000", specialty: "Women's Hormonal Care Center" },
    { id: 7, name: "Max Super Speciality Hospital", state: "Delhi", district: "New Delhi", address: "1-2, Press Enclave Road, Saket, New Delhi", phone: "+91-11-2651-5050", specialty: "Reproductive Medicine & PCOS" },
    { id: 8, name: "Apollo Women's Hospital", state: "Tamil Nadu", district: "Chennai", address: "15, Shafee Mohammed Rd, Thousand Lights West, Chennai", phone: "+91-44-2829-0200", specialty: "Comprehensive Gynecological Center" },
    { id: 9, name: "Rainbow Children's & BirthRight Hospital", state: "Telangana", district: "Hyderabad", address: "Road No. 2, Banjara Hills, Hyderabad", phone: "+91-40-4466-5555", specialty: "Fertility & Hormonal Wellness" },
  ];

  useEffect(() => {
    // Try fetching from API backend
    fetch("/api/hospitals/regions")
      .then((res) => res.json())
      .then((data) => {
        if (data && Object.keys(data).length > 0) setRegions(data);
      })
      .catch(() => {});

    fetchHospitals();
  }, [selectedState, selectedDistrict]);

  const fetchHospitals = () => {
    setLoading(true);
    let url = `/api/hospitals?state=${encodeURIComponent(selectedState)}`;
    if (selectedDistrict) url += `&district=${encodeURIComponent(selectedDistrict)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHospitals(data);
        } else {
          // Filter fallback data
          const filtered = fallbackHospitals.filter(
            (h) =>
              h.state.toLowerCase() === selectedState.toLowerCase() &&
              (!selectedDistrict || h.district.toLowerCase() === selectedDistrict.toLowerCase())
          );
          setHospitals(filtered);
        }
      })
      .catch(() => {
        const filtered = fallbackHospitals.filter(
          (h) =>
            h.state.toLowerCase() === selectedState.toLowerCase() &&
            (!selectedDistrict || h.district.toLowerCase() === selectedDistrict.toLowerCase())
        );
        setHospitals(filtered);
      })
      .finally(() => setLoading(false));
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGoogleMapsLink = (name: string, address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
  };

  const states = Object.keys(regions).sort();
  const districts = selectedState && regions[selectedState] ? regions[selectedState].sort() : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-100/80 flex items-center justify-center text-2xl shadow-sm border border-pink-200/60">
            🏥
          </div>
          <div>
            <h2 className="text-2xl font-serif-title font-bold text-gray-800">
              Hospital & Specialist Finder
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Locate top diagnostic centers & gynecologists in India
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-3d p-6 sm:p-8 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              SELECT STATE
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
              className="input-blush w-full cursor-pointer"
            >
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              SELECT DISTRICT / CITY
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="input-blush w-full cursor-pointer"
            >
              <option value="">-- All Cities --</option>
              {districts.map((dst) => (
                <option key={dst} value={dst}>
                  {dst}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            SEARCH BY NAME OR SPECIALTY
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-pink-400" />
            <input
              type="text"
              placeholder="e.g. Manipal, Endocrinology, Ultrasound..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-blush w-full pl-10"
            />
          </div>
        </div>
      </motion.div>

      {/* Results List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 card-3d">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-2" />
            <p className="text-gray-400 text-xs font-medium">Searching medical directory...</p>
          </div>
        ) : filteredHospitals.length > 0 ? (
          filteredHospitals.map((h, idx) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card-3d p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-pink-100/90 text-pink-600 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif-title font-bold text-gray-800 text-base">
                      {h.name}
                    </h4>
                    <span className="inline-block bg-purple-50 text-purple-700 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border border-purple-100">
                      {h.specialty}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-gray-500 pl-12">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-pink-400" />
                  <span>{h.address}</span>
                </div>

                {h.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 pl-12">
                    <Phone className="w-3.5 h-3.5 text-pink-400" />
                    <span>{h.phone}</span>
                  </div>
                )}
              </div>

              <div className="pl-12 sm:pl-0 shrink-0">
                <a
                  href={getGoogleMapsLink(h.name, h.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 px-4 py-2.5 rounded-xl transition-all shadow-xs"
                >
                  Open Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 card-3d">
            <p className="text-xs text-gray-400">No clinics found matching your query. Try another location.</p>
          </div>
        )}
      </div>
    </div>
  );
}
