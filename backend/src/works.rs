use actix_web::{delete, get, patch, post, HttpResponse, Responder};

#[post("/works")]
pub async fn create_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[get("/works/{id}")]
pub async fn get_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[patch("/works/{id}")]
pub async fn update_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[delete("/works/{id}")]
pub async fn delete_work() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}
