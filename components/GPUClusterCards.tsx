export default function GPUClusterCards() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="relative flex gap-8">
        {/* Gradient line connecting the cards at the top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #facc15 20%, #facc15 80%, transparent 100%)',
            transform: 'translateY(-40px)'
          }}
        />

        {/* Three GPU Cards */}
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="relative bg-gray-900 rounded-xl p-12 flex items-center justify-center"
            style={{
              width: '280px',
              height: '240px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a'
            }}
          >
            {/* Vertical line connecting to gradient */}
            <div
              className="absolute top-0 left-1/2 transform -translate-x-1/2"
              style={{
                width: '1px',
                height: '40px',
                background: '#facc15',
                transform: 'translate(-50%, -40px)'
              }}
            />

            <span className="text-2xl font-medium text-gray-400">8x GPUs</span>
          </div>
        ))}
      </div>
    </div>
  );
}