import React from 'react';

const CheckIcon = () => (
  <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const PricingCard: React.FC<{ tier: string, price: string, description: string, features: string[], popular?: boolean }> = ({ tier, price, description, features, popular }) => {
  return (
    <div className={`relative border rounded-xl p-8 flex flex-col ${popular ? 'border-amber-500 shadow-amber-500/20 shadow-2xl' : 'border-gray-700'}`}>
      {popular && <div className="absolute top-0 -translate-y-1/2 bg-amber-500 text-gray-900 px-3 py-1 text-sm font-semibold rounded-full">MOST POPULAR</div>}
      <h3 className="text-2xl font-semibold text-white">{tier}</h3>
      <p className="mt-4 text-gray-400 h-16">{description}</p>
      <div className="mt-6">
        <span className="text-4xl font-bold text-white">{price}</span>
        {price !== 'Free' && <span className="text-base font-medium text-gray-400">/month</span>}
      </div>
      <ul className="mt-8 space-y-4 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckIcon />
            <span className="ml-3 text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`mt-8 w-full py-3 rounded-lg font-semibold transition-colors duration-300 ${popular ? 'bg-amber-500 text-gray-900 hover:bg-amber-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
        Get Started
      </button>
    </div>
  );
};

const Pricing: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Sustainable Pricing for Real Growth</h2>
        <p className="mt-4 text-xl text-gray-400">Choose a profitable plan that scales with your ambition.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <PricingCard
          tier="Starter"
          price="Free"
          description="A taste of AI power. Perfect for getting started and seeing the potential."
          features={[
            "3 Background Removals/month",
            "3 AI Scene Generations (Watermarked)",
            "No Video Generation"
          ]}
        />
        <PricingCard
          tier="Creator"
          price="Ksh 800"
          description="For the dedicated artisan ready to build a consistent, professional brand online."
          features={[
            "Up to 1,000 Background Removals",
            "20 HD Scene Generations",
            "3 Video Clips (5-sec each)",
            "Remove Watermarks"
          ]}
        />
        <PricingCard
          tier="Business"
          price="Ksh 1,500"
          description="The ultimate toolkit for serious entrepreneurs focused on scaling their brand and sales."
          features={[
            "Everything in Creator",
            "50 HD Scene Generations",
            "10 Video Clips",
            "Save Your Custom Model",
            "Priority Rendering Queue",
            "Batch Upload (10 images)"
          ]}
          popular={true}
        />
        <PricingCard
          tier="Studio"
          price="Ksh 5,000"
          description="For agencies and power users managing multiple brands with high-volume needs."
          features={[
            "Everything in Business",
            "Up to 500 Scene Generations",
            "30 Video Clips",
            "Team Seats (Up to 3 Users)",
            "White-Label Branding",
            "Dedicated Support"
          ]}
        />
      </div>

      <div className="text-center pt-8">
        <h3 className="text-2xl font-bold text-gray-200">Need API Access or Higher Volumes?</h3>
        <p className="mt-3 text-lg text-gray-400">
          We offer custom enterprise plans for businesses that need to integrate Jenga Biashara AI at scale.
        </p>
        <button className="mt-6 bg-transparent border border-amber-400 text-amber-400 font-semibold py-3 px-8 rounded-lg hover:bg-amber-400 hover:text-gray-900 transition-colors duration-300">
          Contact Sales
        </button>
      </div>
    </div>
  );
};

export default Pricing;