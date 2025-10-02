import React from "react";

const LightingCard = ({ light }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center">
      <h2 className="text-lg font-semibold">{light.location}</h2>
      <p
        className={`mt-2 px-3 py-1 rounded-full text-white ${
          light.status === "ON" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {light.status}
      </p>
    </div>
  );
};

export default LightingCard;
