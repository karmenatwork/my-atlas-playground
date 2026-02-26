export default function GoogleMap({ lat, lng }: { lat?: number; lng?: number }) {
    if (typeof lat !== "number" || typeof lng !== "number") {
        return (
            <div className="bg-red-300 text-red-900 p-4 rounded-lg max-w-md">
                <strong>⚠️ Error:</strong> Invalid coordinates received.
            </div>
        );
    }

    const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;

    return (
        <div className="w-full max-w-2xl h-[420px] rounded-lg overflow-hidden border border-slate-200 mt-4">
            <iframe
                title="Place location map"
                src={mapUrl}
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
        </div>
    );
}