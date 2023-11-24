import React from "react"
import * as Icon1 from "react-icons/bi"
import * as Icon3 from "react-icons/hi2"
import * as Icon2 from "react-icons/io5"

const contactDetails = [
    {
        icon: "HiChatBubbleLeftRight",
        heading: "Chat with us",
        description: "Our friendly team is here to help.",
        details: "info@studymania.com",
    },
    {
        icon: "BiWorld",
        heading: "Visit us",
        description: "Come and say hello at our office HQ.",
        details:
            "83 Vidyaman Nagar, Pune, 411005",
    },
    {
        icon: "IoCall",
        heading: "Call us",
        description: "Mon - Fri From 8am to 5pm",
        details: "+91 98765 43210",
    },
]

const ContactDetails = () => {
    return (
        <div className="flex flex-col gap-6 rounded-xl bg-richblack-800 p-4 lg:p-6">
            {contactDetails.map((data, index) => {
                let Icon = Icon1[data.icon] || Icon2[data.icon] || Icon3[data.icon]
                return (
                    <div
                        className="flex flex-col gap-[2px] p-3 text-sm text-richblack-200"
                        key={index}
                    >
                        <div className="flex flex-row items-center gap-3">
                            <Icon size={25} />
                            <h1 className="text-lg font-semibold text-richblack-5">
                                {data?.heading}
                            </h1>
                        </div>
                        <p className="font-medium">{data?.description}</p>
                        <p className="font-semibold">{data?.details}</p>
                    </div>
                )
            })}
        </div>
    )
}

export default ContactDetails
