export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 mt-10">
      <div className="max-w-6xl mx-auto px-4 text-center">

        <h2 className="text-2xl font-bold mb-2">Hygene Hub.</h2>

        <p className="text-gray-300 mb-4">
          Premium and refreshing hand wash liquids for everyday hygiene.
        </p>

        <hr className="border-gray-700 my-4" />

        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} Hygene Hub. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
