require 'sinatra'
require 'net/http'
require 'net/https'
require 'uri'
require './chatwork_task_puller.rb'
require './credentials.rb'

set :port, 4568



#REST API Endpoints

get '/' do
  'This is the Chatwork Task Grabber Microservice!'
end

get '/new-chatwork-tasks' do
  tasks = ChatworkTaskPuller.get_new_tasks

  #Post to Ryukyu Social API with token and new task for each task
  responses = []
  tasks.each do |task|
    if task["status"] == "finished" #existing task, update the status
      results = /Chatwork Task\[(\d+)\]/m.match(task["name"])
      chatwork_task_id = results[1]

      put_uri = URI.parse("https://ryukyu-social.cleverword.com/tasks_service/api/tasks/name-like/#{chatwork_task_id}")
      https = Net::HTTP.new(put_uri.host,put_uri.port)
      https.use_ssl = true
      my_put_request = Net::HTTP::Put.new(put_uri.path, initheader = {'Content-Type' =>'application/json',
                                                                       'x-access-token' => Credentials.tasks_service_token})
      my_put_request.set_form_data(task)
      http_response = https.request(my_put_request)

      response = {}
      response["ryukyu_tasks_service_response"] = http_response.body
      response["task"] = task
      responses << response
    else #brand new task, add it
      uri = URI.parse("https://ryukyu-social.cleverword.com/tasks_service/api/tasks")
      https = Net::HTTP.new(uri.host,uri.port)
      https.use_ssl = true
      my_post_request = Net::HTTP::Post.new(uri.path, initheader = {'Content-Type' =>'application/json',
                                                                    'x-access-token' => Credentials.tasks_service_token})
      my_post_request.set_form_data(task)
      http_response = https.request(my_post_request)

      response = {}
      response["ryukyu_tasks_service_response"] = http_response.body
      response["task"] = task
      responses << response
    end

  end

  responses.to_json
end