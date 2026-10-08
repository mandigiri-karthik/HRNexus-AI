import { describe, it, expect } from "vitest";
import { anonymiseProfile, RawProfile } from "./career-suggester";

describe("CareerSuggester - PII Anonymization", () => {
  it("strictly removes candidate name, contact, location, and identifiable employer names", () => {
    const sensitiveProfile: RawProfile = {
      name: "Jane Elizabeth Doe",
      email: "jane.doe.confidential@secretcorp.co.uk",
      phone: "+44 7700 900456",
      address: "Apartment 4B, 22 Kensington High St, London, W8 4PE",
      dateOfBirth: "1992-04-12",
      nationalInsurance: "QQ 98 76 54 B",
      experience: [
        {
          jobTitle: "Senior Operations Director",
          company: "Secret Global Financial Ltd",
          employerType: "FinTech & Banking",
          city: "London",
          startYear: 2020,
          endYear: 2024,
          tasks: [
            "Managed team of 25 staff at Secret Corp",
            "Contact me at jane.doe@secretcorp.co.uk or 07700900456 for references",
          ],
          tools: ["SAP", "Tableau", "Jira"],
        },
      ],
      qualifications: [
        {
          name: "MSc International Finance",
          level: "Master's Degree",
          institution: "University of Oxford",
        },
      ],
      skills: ["Financial Modeling", "Strategic Planning", "Team Leadership"],
      goals: "I want to move to another investment bank in London. Reach out to jane.doe.confidential@secretcorp.co.uk",
    };

    const anonymised = anonymiseProfile(sensitiveProfile);
    const serialized = JSON.stringify(anonymised);

    // Ensure direct identifiers are NOT present
    expect(serialized).not.toContain("Jane Elizabeth Doe");
    expect(serialized).not.toContain("jane.doe.confidential@secretcorp.co.uk");
    expect(serialized).not.toContain("jane.doe@secretcorp.co.uk");
    expect(serialized).not.toContain("+44 7700 900456");
    expect(serialized).not.toContain("07700900456");
    expect(serialized).not.toContain("Apartment 4B");
    expect(serialized).not.toContain("W8 4PE");
    expect(serialized).not.toContain("QQ 98 76 54 B");
    expect(serialized).not.toContain("Secret Global Financial Ltd");
    expect(serialized).not.toContain("Secret Corp");

    // Ensure essential career skills and functional experience remain intact
    expect(anonymised.experience[0].jobTitle).toBe("Senior Operations Director");
    expect(anonymised.experience[0].industrySector).toBe("FinTech & Banking");
    expect(anonymised.skills).toContain("Financial Modeling");
    expect(anonymised.skills).toContain("Strategic Planning");
    expect(anonymised.qualifications[0].qualification).toBe("MSc International Finance");
  });
});
