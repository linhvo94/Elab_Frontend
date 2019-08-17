import React from "react";


export default class Body extends React.Component {
    render() {
        return (
            <div className="container-fluid">
                <section className="row intro-section">
                    <div className="col-12 col-sm-12 col-md-12 col-lg-6 col-xl-6 intro-leftside">
                        <h1>To learn, to grow, and to succeed</h1>
                        <p>You are already here, so we promise to provide the most mordern communication technology for your learning journey.</p>
                    </div>
                    <div className="col-12 col-sm-12 col-md-12 col-lg-5 intro-rightside">
                        <img src="https://cdn.dribbble.com/users/5055/screenshots/5710560/dr5_4x.png" alt="home intro" />
                    </div>
                </section>

                <section className="howto-section">
                    <div className="row">
                        <div className="col-12 col-sm-12 col-md-12 col-lg-12 col-xl-12">
                            <h1>Get Started</h1>
                            <p>Plead read below steps to give yourself some understanding about this system.</p>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12 col-sm-12 col-md-4 col-lg-4 col-xl-4">
                            <i className="fas fa-user-graduate fa-3x"></i>
                            <h3>Sign up</h3>
                            <p>Create a new account based on your role (student/lecturer) before using the system.</p>
                        </div>

                        <div className="col-12 col-sm-12 col-md-4 col-lg-4 col-xl-4">
                            <i className="fas fa-broadcast-tower fa-3x"></i>
                            <h3>Livestream</h3>
                            <p>Live stream your lecture as a class session if you are a lecturer. Join in a livestream if you are a student.</p>
                        </div>

                        <div className="col-12 col-sm-12 col-md-4 col-lg-4 col-xl-4">
                            <i className="fas fa-comments fa-3x"></i>
                            <h3>Communication with others</h3>
                            <p>You can make peer-to-peer call or group call as you want.</p>
                        </div>
                    </div>
                </section>

                <section className="availability-section">
                    <div className="row">
                        <div className="col-12 col-sm-12 col-md-12 col-lg-6 col-xl-6">
                            <h1>Platforms</h1>
                            <img src="https://cdn.dribbble.com/users/1458982/screenshots/5933007/hero-illustration_4x.png" alt="platforms" />
                        </div>
                        <div className="col-12 col-sm-12 col-md-12 col-lg-6 col-xl-6 platforms-logos">
                            <div>
                                <i className="fas fa-globe fa-5x"></i> <span>Website</span>
                            </div>
                            <div>
                                <i className="fab fa-app-store-ios fa-5x"></i> <span>iOS</span>
                            </div>
                            <div>
                                <i className="fab fa-android fa-5x"></i> <span>Android</span>
                            </div>

                        </div>
                    </div>
                </section>
            </div>
        );
    }
}