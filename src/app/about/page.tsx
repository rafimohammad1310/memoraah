// app/about/page.tsx
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
     <main className="min-h-screen bg-gray-50">
          {/* Enhanced Navbar */}
          <Navbar />
    <div className="min-h-screen bg-gray-50">
        
      {/* Hero Section */}
      <div className="bg-pink-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-pink-700 mb-6">Our Story</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the passion and dedication behind Memorahh
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* About Section */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <Image
                src="/about-image.png" // Replace with your actual image path
                alt="About Memorahh"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Who We Are</h2>
              <p className="text-gray-600 mb-4">
                Memorahh is a boutique e-commerce platform dedicated to bringing you unique,
                handcrafted products that tell a story. Founded in 2023, we started with a simple
                mission: to connect artisans with customers who appreciate quality and craftsmanship.
              </p>
              <p className="text-gray-600 mb-4">
                Our team is composed of passionate individuals who believe in the power of meaningful
                purchases. Every product in our collection is carefully curated to ensure it meets
                our high standards of quality, sustainability, and aesthetic appeal.
              </p>
              <p className="text-gray-600">
                We're more than just a store - we're a community of like-minded individuals who
                value authenticity and the human touch in every creation.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-20 bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Our Mission & Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-pink-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality</h3>
              <p className="text-gray-600">
                We source only the finest materials and work with skilled artisans to bring you
                products that stand the test of time.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-pink-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
              <p className="text-gray-600">
                We're committed to eco-friendly practices, from sourcing to packaging, to minimize
                our environmental impact.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-pink-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-600">
                We believe in building relationships - with our customers, artisans, and the
                communities we serve.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Meet The Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Rafi Mohammad",
                role: "Founder",
                bio: "With a background in design and a passion for craftsmanship, Alex started Memorahh to bridge the gap between artisans and modern consumers.",
                image: "/team11.jpeg", // Replace with actual image
              },
              {
                name: "Arjun Sai Salendra",
                role: "Founder",
                bio: "Sarah ensures every aspect of our business runs smoothly, from inventory management to customer satisfaction.",
                image: "/team21.jpeg", // Replace with actual image
              },
              {
                name: "Michael Rodriguez",
                role: "Creative Director",
                bio: "Michael curates our product selection and oversees the visual storytelling of our brand.",
                image: "/team3.jpg", // Replace with actual image
              },
            ].map((member, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="w-32 h-32 mx-auto mb-4 overflow-hidden rounded-full">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                </div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-pink-600 mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-pink-700 text-white p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Explore Our Collection?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Discover unique, handcrafted products that tell a story.
          </p>
          <Link
            href="/products"
            className="bg-white text-pink-700 px-8 py-3 rounded-full font-semibold hover:bg-pink-100 transition duration-300 inline-block"
          >
            Shop Now
          </Link>
        </section>
      </div>
    </div>
    </main>
  );
}